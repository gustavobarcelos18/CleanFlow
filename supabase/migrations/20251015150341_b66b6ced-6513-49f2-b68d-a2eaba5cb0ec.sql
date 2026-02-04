-- ETAPA 4: Engine de Preços + FX + Markup

-- Tabela de preços configuráveis por categoria
CREATE TABLE IF NOT EXISTS public.precos_atual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('marketing', 'utility', 'auth', 'service', 'conversation')),
  preco_unitario NUMERIC(10, 6) NOT NULL CHECK (preco_unitario >= 0),
  moeda TEXT NOT NULL DEFAULT 'BRL' CHECK (moeda IN ('BRL', 'USD')),
  vigencia_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vigencia_fim TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT vigencia_valida CHECK (vigencia_fim IS NULL OR vigencia_fim > vigencia_inicio)
);

-- Tabela de FX (câmbio)
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moeda_origem TEXT NOT NULL DEFAULT 'USD',
  moeda_destino TEXT NOT NULL DEFAULT 'BRL',
  taxa NUMERIC(10, 6) NOT NULL CHECK (taxa > 0),
  data_cotacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fonte TEXT NOT NULL DEFAULT 'manual',
  override_manual BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(moeda_origem, moeda_destino, data_cotacao)
);

-- Tabela de Markup configurável
CREATE TABLE IF NOT EXISTS public.markup_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  categoria TEXT CHECK (categoria IN ('marketing', 'utility', 'auth', 'service', 'conversation')),
  margem_pct NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (margem_pct >= 0 AND margem_pct <= 100),
  vigencia_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vigencia_fim TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT markup_tenant_ou_plan CHECK (
    (tenant_id IS NOT NULL AND plan_id IS NULL) OR 
    (tenant_id IS NULL AND plan_id IS NOT NULL)
  )
);

-- Histórico de alterações de preços
CREATE TABLE IF NOT EXISTS public.historico_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preco_id UUID REFERENCES public.precos_atual(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL,
  preco_anterior NUMERIC(10, 6),
  preco_novo NUMERIC(10, 6) NOT NULL,
  alterado_por UUID REFERENCES auth.users(id),
  motivo TEXT,
  validacao_ok BOOLEAN NOT NULL DEFAULT true,
  erros_validacao JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ETAPA 5: Faturas, Excedente, Cobrança e Dunning

-- Tabela de consumo mensal consolidado
CREATE TABLE IF NOT EXISTS public.consumo_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('marketing', 'utility', 'auth', 'service', 'conversation')),
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  preco_unitario NUMERIC(10, 6) NOT NULL,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  franquia INTEGER NOT NULL DEFAULT 0,
  excedente INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, mes_referencia, categoria)
);

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero_fatura TEXT UNIQUE NOT NULL,
  mes_referencia DATE NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_vencimento DATE NOT NULL,
  valor_plano NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_excedente NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12, 2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  link_pagamento TEXT,
  notas_fiscais JSONB,
  observacoes TEXT,
  pago_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens da fatura
CREATE TABLE IF NOT EXISTS public.itens_fatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
  preco_unitario NUMERIC(10, 6) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de regras de dunning (cobrança)
CREATE TABLE IF NOT EXISTS public.dunning_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dias_atraso INTEGER NOT NULL CHECK (dias_atraso > 0),
  acao TEXT NOT NULL CHECK (acao IN ('lembrete', 'restricao_marketing', 'restricao_outbound', 'suspensao_total')),
  canal_notificacao TEXT[] NOT NULL DEFAULT ARRAY['email'],
  template_mensagem TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de dunning
CREATE TABLE IF NOT EXISTS public.historico_dunning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fatura_id UUID NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  dias_atraso INTEGER NOT NULL,
  acao_tomada TEXT NOT NULL,
  canal TEXT NOT NULL,
  mensagem_enviada TEXT,
  sucesso BOOLEAN NOT NULL DEFAULT true,
  erro_mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de status de restrição do tenant
CREATE TABLE IF NOT EXISTS public.restricoes_tenant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo_restricao TEXT NOT NULL CHECK (tipo_restricao IN ('nenhuma', 'soft_marketing', 'soft_outbound', 'suspensao_total')),
  motivo TEXT NOT NULL,
  iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  removido_em TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_precos_categoria_vigencia ON public.precos_atual(categoria, vigencia_inicio, vigencia_fim) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_fx_rates_moedas_data ON public.fx_rates(moeda_origem, moeda_destino, data_cotacao DESC) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_markup_tenant ON public.markup_configs(tenant_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_markup_plan ON public.markup_configs(plan_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_consumo_tenant_mes ON public.consumo_mensal(tenant_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_faturas_tenant_status ON public.faturas(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_faturas_vencimento ON public.faturas(data_vencimento) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_restricoes_tenant ON public.restricoes_tenant(tenant_id) WHERE ativo = true;

-- Triggers para updated_at
CREATE TRIGGER update_precos_atual_updated_at
  BEFORE UPDATE ON public.precos_atual
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_markup_configs_updated_at
  BEFORE UPDATE ON public.markup_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consumo_mensal_updated_at
  BEFORE UPDATE ON public.consumo_mensal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faturas_updated_at
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dunning_configs_updated_at
  BEFORE UPDATE ON public.dunning_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restricoes_tenant_updated_at
  BEFORE UPDATE ON public.restricoes_tenant
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- precos_atual
ALTER TABLE public.precos_atual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master users can manage prices"
  ON public.precos_atual FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

CREATE POLICY "Support users can view prices"
  ON public.precos_atual FOR SELECT
  USING (has_support_access(auth.uid()));

-- fx_rates
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master users can manage FX rates"
  ON public.fx_rates FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

CREATE POLICY "Support users can view FX rates"
  ON public.fx_rates FOR SELECT
  USING (has_support_access(auth.uid()));

-- markup_configs
ALTER TABLE public.markup_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master users can manage markup"
  ON public.markup_configs FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

CREATE POLICY "Support users can view markup"
  ON public.markup_configs FOR SELECT
  USING (has_support_access(auth.uid()));

-- historico_precos
ALTER TABLE public.historico_precos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support users can view price history"
  ON public.historico_precos FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Master users can manage price history"
  ON public.historico_precos FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

-- consumo_mensal
ALTER TABLE public.consumo_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own consumption"
  ON public.consumo_mensal FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Support users can view all consumption"
  ON public.consumo_mensal FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support users can manage consumption"
  ON public.consumo_mensal FOR ALL
  USING (has_support_access(auth.uid()));

-- faturas
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own invoices"
  ON public.faturas FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Support users can manage invoices"
  ON public.faturas FOR ALL
  USING (has_support_access(auth.uid()));

-- itens_fatura
ALTER TABLE public.itens_fatura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items"
  ON public.itens_fatura FOR SELECT
  USING (
    fatura_id IN (
      SELECT id FROM faturas 
      WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Support users can manage invoice items"
  ON public.itens_fatura FOR ALL
  USING (has_support_access(auth.uid()));

-- dunning_configs
ALTER TABLE public.dunning_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master users can manage dunning configs"
  ON public.dunning_configs FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

CREATE POLICY "Support users can view dunning configs"
  ON public.dunning_configs FOR SELECT
  USING (has_support_access(auth.uid()));

-- historico_dunning
ALTER TABLE public.historico_dunning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own dunning history"
  ON public.historico_dunning FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Support users can view all dunning history"
  ON public.historico_dunning FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support users can manage dunning history"
  ON public.historico_dunning FOR ALL
  USING (has_support_access(auth.uid()));

-- restricoes_tenant
ALTER TABLE public.restricoes_tenant ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own restrictions"
  ON public.restricoes_tenant FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Support users can manage restrictions"
  ON public.restricoes_tenant FOR ALL
  USING (has_support_access(auth.uid()));

-- Inserir configurações padrão de dunning
INSERT INTO public.dunning_configs (dias_atraso, acao, canal_notificacao, template_mensagem) VALUES
  (1, 'lembrete', ARRAY['email', 'whatsapp'], 'Seu pagamento venceu ontem. Por favor, regularize sua situação.'),
  (5, 'lembrete', ARRAY['email', 'whatsapp'], 'Seu pagamento está atrasado há 5 dias. Evite restrições, pague agora.'),
  (10, 'lembrete', ARRAY['email', 'whatsapp'], 'Pagamento atrasado há 10 dias. Regularize para manter todos os serviços.'),
  (15, 'restricao_marketing', ARRAY['email'], 'Após 15 dias de atraso, restringimos envio de mensagens de marketing.'),
  (30, 'restricao_outbound', ARRAY['email'], 'Após 30 dias de atraso, suspendemos mensagens outbound (marketing e utility).')
ON CONFLICT DO NOTHING;