
-- =====================================================
-- SISTEMA COMPLETO DE WHATSAPP MULTI-TENANT
-- =====================================================

-- 1. Provedores de números virtuais
CREATE TABLE public.whatsapp_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  custo_mensal_numero NUMERIC NOT NULL DEFAULT 0,
  custo_por_mensagem NUMERIC NOT NULL DEFAULT 0,
  moeda TEXT NOT NULL DEFAULT 'EUR',
  ativo BOOLEAN NOT NULL DEFAULT true,
  configuracoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Números de telefone contratados pelo ClinFlow
CREATE TABLE public.whatsapp_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES whatsapp_providers(id),
  phone_number TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  waba_id TEXT, -- WhatsApp Business Account ID
  phone_number_id TEXT, -- Meta Phone Number ID
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  custo_mensal NUMERIC NOT NULL DEFAULT 0,
  moeda TEXT NOT NULL DEFAULT 'EUR',
  provisionado_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Alocação de números para tenants (aluguel)
CREATE TABLE public.tenant_phone_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id UUID NOT NULL REFERENCES whatsapp_phone_numbers(id),
  departamento TEXT NOT NULL DEFAULT 'geral',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  alocado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelado_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone_number_id, departamento)
);

-- 4. Assinaturas de números (billing)
CREATE TABLE public.phone_number_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  allocation_id UUID NOT NULL REFERENCES tenant_phone_allocations(id) ON DELETE CASCADE,
  preco_mensal NUMERIC NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  periodo_atual_inicio TIMESTAMPTZ,
  periodo_atual_fim TIMESTAMPTZ,
  cancelado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Departamentos do tenant para roteamento
CREATE TABLE public.tenant_whatsapp_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descricao TEXT,
  phone_allocation_id UUID REFERENCES tenant_phone_allocations(id),
  responsavel_id UUID REFERENCES profiles(id),
  horario_atendimento JSONB DEFAULT '{"seg":{"inicio":"08:00","fim":"18:00"},"ter":{"inicio":"08:00","fim":"18:00"},"qua":{"inicio":"08:00","fim":"18:00"},"qui":{"inicio":"08:00","fim":"18:00"},"sex":{"inicio":"08:00","fim":"18:00"}}',
  mensagem_fora_horario TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, codigo)
);

-- 6. Configuração de roteamento IA por tenant
CREATE TABLE public.tenant_whatsapp_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  usa_numero_compartilhado BOOLEAN NOT NULL DEFAULT true,
  ai_routing_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  ai_system_prompt TEXT,
  menu_inicial_enabled BOOLEAN NOT NULL DEFAULT false,
  menu_opcoes JSONB DEFAULT '[]',
  fallback_departamento_id UUID REFERENCES tenant_whatsapp_departments(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Conversas no número compartilhado (para IA identificar)
CREATE TABLE public.whatsapp_shared_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID NOT NULL REFERENCES whatsapp_phone_numbers(id),
  customer_phone TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  departamento_id UUID REFERENCES tenant_whatsapp_departments(id),
  status TEXT NOT NULL DEFAULT 'pending_identification' CHECK (status IN ('pending_identification', 'identified', 'active', 'resolved', 'expired')),
  ai_confidence NUMERIC,
  ai_reasoning TEXT,
  identificado_em TIMESTAMPTZ,
  ultima_mensagem_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone_number_id, customer_phone)
);

-- 8. Contexto de identificação IA
CREATE TABLE public.whatsapp_ai_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_shared_conversations(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  direcao TEXT NOT NULL CHECK (direcao IN ('incoming', 'outgoing')),
  tokens_input INTEGER,
  tokens_output INTEGER,
  ai_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Pacotes de números (para venda)
CREATE TABLE public.phone_number_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  quantidade_numeros INTEGER NOT NULL DEFAULT 1,
  preco_mensal NUMERIC NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  inclui_creditos INTEGER NOT NULL DEFAULT 0,
  planos_permitidos TEXT[] NOT NULL DEFAULT ARRAY['pro', 'enterprise'],
  destaque BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

CREATE TRIGGER update_whatsapp_providers_updated_at
  BEFORE UPDATE ON whatsapp_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_phone_numbers_updated_at
  BEFORE UPDATE ON whatsapp_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_phone_allocations_updated_at
  BEFORE UPDATE ON tenant_phone_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_number_subscriptions_updated_at
  BEFORE UPDATE ON phone_number_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_whatsapp_departments_updated_at
  BEFORE UPDATE ON tenant_whatsapp_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_whatsapp_routing_updated_at
  BEFORE UPDATE ON tenant_whatsapp_routing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_shared_conversations_updated_at
  BEFORE UPDATE ON whatsapp_shared_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_number_packages_updated_at
  BEFORE UPDATE ON phone_number_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE whatsapp_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_phone_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_number_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_whatsapp_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_whatsapp_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_shared_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_ai_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_number_packages ENABLE ROW LEVEL SECURITY;

-- Providers (somente suporte)
CREATE POLICY "Support can manage providers" ON whatsapp_providers
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY "Everyone can view active providers" ON whatsapp_providers
  FOR SELECT USING (ativo = true);

-- Phone Numbers (suporte gerencia, tenants veem seus)
CREATE POLICY "Support can manage phone numbers" ON whatsapp_phone_numbers
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view allocated numbers" ON whatsapp_phone_numbers
  FOR SELECT USING (
    id IN (
      SELECT phone_number_id FROM tenant_phone_allocations 
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
    OR is_shared = true
  );

-- Allocations
CREATE POLICY "Support can manage allocations" ON tenant_phone_allocations
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own allocations" ON tenant_phone_allocations
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin can manage own allocations" ON tenant_phone_allocations
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions
CREATE POLICY "Support can manage subscriptions" ON phone_number_subscriptions
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own subscriptions" ON phone_number_subscriptions
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Departments
CREATE POLICY "Tenants can manage own departments" ON tenant_whatsapp_departments
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Routing
CREATE POLICY "Tenants can manage own routing" ON tenant_whatsapp_routing
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Shared Conversations
CREATE POLICY "Support can view all shared conversations" ON whatsapp_shared_conversations
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own shared conversations" ON whatsapp_shared_conversations
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- AI Context
CREATE POLICY "Support can view all AI context" ON whatsapp_ai_context
  FOR ALL USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own AI context" ON whatsapp_ai_context
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM whatsapp_shared_conversations 
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Packages
CREATE POLICY "Everyone can view active packages" ON phone_number_packages
  FOR SELECT USING (ativo = true);

CREATE POLICY "Support can manage packages" ON phone_number_packages
  FOR ALL USING (has_support_access(auth.uid()));

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Provedor 360dialog
INSERT INTO whatsapp_providers (nome, api_base_url, custo_mensal_numero, custo_por_mensagem, moeda, configuracoes) VALUES
('360dialog', 'https://waba.360dialog.io/v1', 15.00, 0.00, 'EUR', '{"partner_id": null, "api_key_header": "D360-API-KEY"}');

-- Número compartilhado do ClinFlow
INSERT INTO whatsapp_phone_numbers (provider_id, phone_number, display_name, is_shared, status, custo_mensal, moeda)
SELECT id, '+5511999999999', 'ClinFlow Compartilhado', true, 'active', 15.00, 'EUR'
FROM whatsapp_providers WHERE nome = '360dialog';

-- Pacotes de números
INSERT INTO phone_number_packages (nome, descricao, quantidade_numeros, preco_mensal, moeda, inclui_creditos, planos_permitidos, destaque) VALUES
('Número Único', '1 número exclusivo para sua clínica', 1, 79.00, 'BRL', 500, ARRAY['pro', 'enterprise'], false),
('Pacote Departamentos', '3 números para setores diferentes', 3, 199.00, 'BRL', 1500, ARRAY['pro', 'enterprise'], true),
('Enterprise', '5 números + suporte prioritário', 5, 349.00, 'BRL', 3000, ARRAY['enterprise'], false);

-- Função para alocar número compartilhado a novo tenant
CREATE OR REPLACE FUNCTION allocate_shared_number_to_tenant(p_tenant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shared_phone_id UUID;
  v_allocation_id UUID;
BEGIN
  -- Buscar número compartilhado
  SELECT id INTO v_shared_phone_id
  FROM whatsapp_phone_numbers
  WHERE is_shared = true AND status = 'active'
  LIMIT 1;

  IF v_shared_phone_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum número compartilhado disponível';
  END IF;

  -- Criar alocação
  INSERT INTO tenant_phone_allocations (tenant_id, phone_number_id, departamento, is_primary)
  VALUES (p_tenant_id, v_shared_phone_id, 'geral', true)
  ON CONFLICT (tenant_id, phone_number_id, departamento) DO NOTHING
  RETURNING id INTO v_allocation_id;

  -- Criar configuração de roteamento
  INSERT INTO tenant_whatsapp_routing (tenant_id, usa_numero_compartilhado, ai_routing_enabled)
  VALUES (p_tenant_id, true, true)
  ON CONFLICT (tenant_id) DO NOTHING;

  RETURN v_allocation_id;
END;
$$;

-- Função para identificar tenant por IA
CREATE OR REPLACE FUNCTION identify_tenant_from_context(
  p_conversation_id UUID,
  p_tenant_id UUID,
  p_confidence NUMERIC,
  p_reasoning TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE whatsapp_shared_conversations
  SET 
    tenant_id = p_tenant_id,
    status = 'identified',
    ai_confidence = p_confidence,
    ai_reasoning = p_reasoning,
    identificado_em = now()
  WHERE id = p_conversation_id;
END;
$$;
