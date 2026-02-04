-- Tabela para assinaturas de números de telefone
CREATE TABLE IF NOT EXISTS public.phone_number_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES phone_number_packages(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'cancellation_scheduled', 'expired')),
  
  -- Datas importantes
  data_inicio DATE,
  data_proximo_faturamento DATE,
  data_cancelamento_solicitado TIMESTAMP WITH TIME ZONE,
  data_cancelamento_efetivo DATE,
  data_fim DATE,
  
  -- Valores
  valor_mensal NUMERIC(10,2) NOT NULL,
  valor_custo NUMERIC(10,2), -- Custo do provedor
  markup_percentual NUMERIC(5,2) DEFAULT 30.00, -- Markup do ClinFlow
  moeda TEXT DEFAULT 'BRL',
  
  -- Números alocados
  numeros_contratados INTEGER NOT NULL DEFAULT 1,
  numeros_ativos INTEGER DEFAULT 0,
  
  -- Metadados
  departamentos JSONB DEFAULT '["geral"]',
  metadata JSONB DEFAULT '{}',
  
  -- Controle
  notificacao_renovacao_enviada BOOLEAN DEFAULT FALSE,
  aceite_termos_cancelamento BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Tabela para logs de cancelamento
CREATE TABLE IF NOT EXISTS public.phone_subscription_cancellation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES phone_number_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('solicitacao', 'confirmacao', 'efetivacao', 'reativacao')),
  motivo TEXT,
  usuario_id UUID,
  data_efetivacao_prevista DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configuração de markup por pacote (admin)
CREATE TABLE IF NOT EXISTS public.phone_package_markups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES phone_number_packages(id) ON DELETE CASCADE,
  custo_provedor NUMERIC(10,2) NOT NULL, -- Custo real do provedor
  markup_percentual NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  preco_final NUMERIC(10,2) GENERATED ALWAYS AS (custo_provedor * (1 + markup_percentual/100)) STORED,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(package_id)
);

-- Adicionar colunas extras na phone_number_packages se não existirem
ALTER TABLE phone_number_packages 
ADD COLUMN IF NOT EXISTS custo_provedor NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS markup_percentual NUMERIC(5,2) DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS periodo_minimo_dias INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS permite_cancelamento_imediato BOOLEAN DEFAULT FALSE;

-- Adicionar colunas na tenant_phone_allocations para vincular à subscription
ALTER TABLE tenant_phone_allocations
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES phone_number_subscriptions(id),
ADD COLUMN IF NOT EXISTS provedor_phone_id TEXT,
ADD COLUMN IF NOT EXISTS provedor_order_id TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_phone_subscriptions_tenant ON phone_number_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_phone_subscriptions_status ON phone_number_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_phone_subscriptions_stripe ON phone_number_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_logs_subscription ON phone_subscription_cancellation_logs(subscription_id);

-- Triggers
CREATE TRIGGER update_phone_subscriptions_updated_at
  BEFORE UPDATE ON phone_number_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE phone_number_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_subscription_cancellation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_package_markups ENABLE ROW LEVEL SECURITY;

-- Políticas para tenants
CREATE POLICY "Tenants can view their own subscriptions" ON phone_number_subscriptions
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their tenant subscriptions" ON phone_number_subscriptions
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Tenants can view their cancellation logs" ON phone_subscription_cancellation_logs
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Políticas para admin do sistema (support)
CREATE POLICY "Support can view all subscriptions" ON phone_number_subscriptions
  FOR SELECT USING (has_any_support_role(auth.uid()));

CREATE POLICY "Support can manage all subscriptions" ON phone_number_subscriptions
  FOR ALL USING (has_support_role(auth.uid(), 'master'));

CREATE POLICY "Support can view markups" ON phone_package_markups
  FOR SELECT USING (has_any_support_role(auth.uid()));

CREATE POLICY "Master can manage markups" ON phone_package_markups
  FOR ALL USING (has_support_role(auth.uid(), 'master'));

-- Função para calcular data de cancelamento efetivo
CREATE OR REPLACE FUNCTION public.calcular_data_cancelamento_efetivo(p_subscription_id UUID)
RETURNS DATE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sub RECORD;
  v_data_efetiva DATE;
BEGIN
  SELECT * INTO v_sub FROM phone_number_subscriptions WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- O cancelamento só pode ser efetivado no final do ciclo de faturamento
  -- ou após o período mínimo de 30 dias
  v_data_efetiva := GREATEST(
    v_sub.data_proximo_faturamento,
    v_sub.data_inicio + INTERVAL '30 days'
  )::DATE;
  
  RETURN v_data_efetiva;
END;
$$;

-- Função para solicitar cancelamento
CREATE OR REPLACE FUNCTION public.solicitar_cancelamento_numero(
  p_subscription_id UUID,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sub RECORD;
  v_data_efetiva DATE;
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Buscar subscription
  SELECT * INTO v_sub FROM phone_number_subscriptions WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Assinatura não encontrada');
  END IF;
  
  -- Verificar se usuário tem permissão
  SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id AND role = 'admin';
  IF v_tenant_id != v_sub.tenant_id THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Sem permissão para cancelar esta assinatura');
  END IF;
  
  -- Verificar status atual
  IF v_sub.status NOT IN ('active', 'pending') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Assinatura não pode ser cancelada neste status');
  END IF;
  
  -- Calcular data de cancelamento efetivo
  v_data_efetiva := calcular_data_cancelamento_efetivo(p_subscription_id);
  
  -- Atualizar subscription
  UPDATE phone_number_subscriptions
  SET 
    status = 'cancellation_scheduled',
    data_cancelamento_solicitado = now(),
    data_cancelamento_efetivo = v_data_efetiva,
    aceite_termos_cancelamento = true,
    updated_at = now()
  WHERE id = p_subscription_id;
  
  -- Registrar log
  INSERT INTO phone_subscription_cancellation_logs (
    subscription_id,
    tenant_id,
    tipo,
    motivo,
    usuario_id,
    data_efetivacao_prevista,
    metadata
  ) VALUES (
    p_subscription_id,
    v_sub.tenant_id,
    'solicitacao',
    p_motivo,
    v_user_id,
    v_data_efetiva,
    jsonb_build_object(
      'valor_pago', v_sub.valor_mensal,
      'dias_restantes', v_data_efetiva - CURRENT_DATE
    )
  );
  
  RETURN jsonb_build_object(
    'sucesso', true,
    'data_cancelamento_efetivo', v_data_efetiva,
    'dias_restantes', v_data_efetiva - CURRENT_DATE,
    'mensagem', 'Cancelamento agendado. O número permanecerá ativo até ' || to_char(v_data_efetiva, 'DD/MM/YYYY')
  );
END;
$$;