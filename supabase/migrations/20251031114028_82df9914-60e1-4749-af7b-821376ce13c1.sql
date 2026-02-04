-- Sistema de Créditos WhatsApp para Tenants

-- Tabela de créditos/saldo de mensagens por tenant
CREATE TABLE IF NOT EXISTS tenant_whatsapp_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  saldo_creditos INTEGER NOT NULL DEFAULT 0,
  creditos_consumidos INTEGER NOT NULL DEFAULT 0,
  ultimo_consumo_at TIMESTAMP WITH TIME ZONE,
  alerta_baixo_credito_enviado BOOLEAN DEFAULT FALSE,
  limiar_alerta INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Tabela de transações de créditos (compras e consumos)
CREATE TABLE IF NOT EXISTS tenant_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'consumo', 'ajuste', 'estorno')),
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC(10,4),
  valor_total NUMERIC(10,2),
  saldo_anterior INTEGER NOT NULL,
  saldo_novo INTEGER NOT NULL,
  motivo TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de pacotes de créditos disponíveis para compra
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade_creditos INTEGER NOT NULL,
  preco_base NUMERIC(10,2) NOT NULL, -- preço que o Clinflow paga à Meta
  preco_venda NUMERIC(10,2) NOT NULL, -- preço que o tenant paga ao Clinflow
  markup_percentual NUMERIC(5,2) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  destaque BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de configuração WhatsApp no tenant
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_configurado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_verificado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_verificado_em TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_tenant_created 
  ON tenant_credit_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_tipo 
  ON tenant_credit_transactions(tipo);

-- RLS Policies
ALTER TABLE tenant_whatsapp_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- Tenants podem ver seus próprios créditos
CREATE POLICY tenant_view_own_credits ON tenant_whatsapp_credits
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Tenants podem ver suas próprias transações
CREATE POLICY tenant_view_own_transactions ON tenant_credit_transactions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Todos podem ver pacotes ativos
CREATE POLICY everyone_view_active_packages ON credit_packages
  FOR SELECT USING (ativo = true);

-- Support pode gerenciar tudo
CREATE POLICY support_manage_credits ON tenant_whatsapp_credits
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY support_manage_transactions ON tenant_credit_transactions
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY support_manage_packages ON credit_packages
  FOR ALL USING (has_support_access(auth.uid()));

-- Function para debitar créditos
CREATE OR REPLACE FUNCTION debitar_credito_whatsapp(
  p_tenant_id UUID,
  p_quantidade INTEGER DEFAULT 1,
  p_motivo TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_saldo_atual INTEGER;
  v_saldo_novo INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Obter saldo atual com lock
  SELECT saldo_creditos INTO v_saldo_atual
  FROM tenant_whatsapp_credits
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  -- Verificar se tem créditos suficientes
  IF v_saldo_atual IS NULL THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Tenant não possui registro de créditos',
      'codigo', 'NO_CREDIT_RECORD'
    );
  END IF;

  IF v_saldo_atual < p_quantidade THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Créditos insuficientes',
      'codigo', 'INSUFFICIENT_CREDITS',
      'saldo_atual', v_saldo_atual,
      'necessario', p_quantidade
    );
  END IF;

  -- Calcular novo saldo
  v_saldo_novo := v_saldo_atual - p_quantidade;

  -- Atualizar saldo
  UPDATE tenant_whatsapp_credits
  SET 
    saldo_creditos = v_saldo_novo,
    creditos_consumidos = creditos_consumidos + p_quantidade,
    ultimo_consumo_at = now(),
    updated_at = now(),
    alerta_baixo_credito_enviado = CASE 
      WHEN v_saldo_novo <= limiar_alerta THEN FALSE 
      ELSE alerta_baixo_credito_enviado 
    END
  WHERE tenant_id = p_tenant_id;

  -- Registrar transação
  INSERT INTO tenant_credit_transactions (
    tenant_id,
    tipo,
    quantidade,
    saldo_anterior,
    saldo_novo,
    motivo,
    metadata
  ) VALUES (
    p_tenant_id,
    'consumo',
    p_quantidade,
    v_saldo_atual,
    v_saldo_novo,
    p_motivo,
    p_metadata
  ) RETURNING id INTO v_transaction_id;

  -- Verificar se precisa enviar alerta
  IF v_saldo_novo <= (SELECT limiar_alerta FROM tenant_whatsapp_credits WHERE tenant_id = p_tenant_id)
     AND NOT (SELECT alerta_baixo_credito_enviado FROM tenant_whatsapp_credits WHERE tenant_id = p_tenant_id) THEN
    
    -- Criar alarme
    INSERT INTO whatsapp_alarms (
      tenant_id,
      alarm_type,
      severity,
      message,
      threshold_value,
      current_value,
      metadata
    ) VALUES (
      p_tenant_id,
      'low_credits',
      'warning',
      'Créditos WhatsApp baixos: ' || v_saldo_novo || ' mensagens restantes',
      (SELECT limiar_alerta FROM tenant_whatsapp_credits WHERE tenant_id = p_tenant_id),
      v_saldo_novo,
      jsonb_build_object('transaction_id', v_transaction_id)
    );

    -- Marcar alerta como enviado
    UPDATE tenant_whatsapp_credits
    SET alerta_baixo_credito_enviado = TRUE
    WHERE tenant_id = p_tenant_id;
  END IF;

  RETURN jsonb_build_object(
    'sucesso', true,
    'saldo_anterior', v_saldo_atual,
    'saldo_novo', v_saldo_novo,
    'transaction_id', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para creditar (compra)
CREATE OR REPLACE FUNCTION creditar_whatsapp(
  p_tenant_id UUID,
  p_package_id UUID,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_package RECORD;
  v_saldo_atual INTEGER;
  v_saldo_novo INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Obter dados do pacote
  SELECT * INTO v_package
  FROM credit_packages
  WHERE id = p_package_id AND ativo = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'Pacote não encontrado ou inativo'
    );
  END IF;

  -- Obter saldo atual
  SELECT saldo_creditos INTO v_saldo_atual
  FROM tenant_whatsapp_credits
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  -- Se não existe, criar registro
  IF v_saldo_atual IS NULL THEN
    INSERT INTO tenant_whatsapp_credits (tenant_id, saldo_creditos)
    VALUES (p_tenant_id, 0)
    RETURNING saldo_creditos INTO v_saldo_atual;
  END IF;

  -- Calcular novo saldo
  v_saldo_novo := v_saldo_atual + v_package.quantidade_creditos;

  -- Atualizar saldo
  UPDATE tenant_whatsapp_credits
  SET 
    saldo_creditos = v_saldo_novo,
    updated_at = now(),
    alerta_baixo_credito_enviado = FALSE
  WHERE tenant_id = p_tenant_id;

  -- Registrar transação
  INSERT INTO tenant_credit_transactions (
    tenant_id,
    tipo,
    quantidade,
    preco_unitario,
    valor_total,
    saldo_anterior,
    saldo_novo,
    motivo,
    created_by,
    metadata
  ) VALUES (
    p_tenant_id,
    'compra',
    v_package.quantidade_creditos,
    v_package.preco_venda / v_package.quantidade_creditos,
    v_package.preco_venda,
    v_saldo_atual,
    v_saldo_novo,
    'Compra do pacote: ' || v_package.nome,
    p_created_by,
    jsonb_build_object(
      'package_id', p_package_id,
      'package_nome', v_package.nome
    )
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'sucesso', true,
    'saldo_anterior', v_saldo_atual,
    'saldo_novo', v_saldo_novo,
    'creditos_adicionados', v_package.quantidade_creditos,
    'valor_pago', v_package.preco_venda,
    'transaction_id', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir pacotes padrão de exemplo
INSERT INTO credit_packages (nome, descricao, quantidade_creditos, preco_base, preco_venda, markup_percentual, destaque) VALUES
  ('Starter', 'Ideal para começar', 100, 5.00, 15.00, 200.00, false),
  ('Basic', 'Para clínicas pequenas', 500, 20.00, 65.00, 225.00, false),
  ('Professional', 'Mais popular', 1000, 35.00, 120.00, 242.86, true),
  ('Business', 'Alto volume', 5000, 150.00, 550.00, 266.67, false),
  ('Enterprise', 'Ilimitado mensal*', 10000, 280.00, 1000.00, 257.14, false)
ON CONFLICT DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tenant_whatsapp_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_whatsapp_credits_updated_at
  BEFORE UPDATE ON tenant_whatsapp_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_whatsapp_credits_updated_at();