-- Criar tabela de planos de saúde
CREATE TABLE IF NOT EXISTS public.planos_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar campos ao cadastro de pacientes
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS plano_saude_id UUID REFERENCES public.planos_saude(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS numero_carteirinha TEXT;

-- Criar índice para plano padrão "Particular"
CREATE INDEX IF NOT EXISTS idx_pacientes_plano_saude ON public.pacientes(plano_saude_id);

-- Adicionar campo ao agendamento para tipo de atendimento
ALTER TABLE public.agenda
ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT DEFAULT 'plano' CHECK (tipo_atendimento IN ('plano', 'particular')),
ADD COLUMN IF NOT EXISTS valor_consulta NUMERIC;

-- Criar tabela de caixa diário
CREATE TABLE IF NOT EXISTS public.caixa_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  agendamento_id UUID REFERENCES public.agenda(id) ON DELETE SET NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo_lancamento TEXT NOT NULL CHECK (tipo_lancamento IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  descricao TEXT,
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para caixa diário
CREATE INDEX IF NOT EXISTS idx_caixa_diario_tenant_data ON public.caixa_diario(tenant_id, data);
CREATE INDEX IF NOT EXISTS idx_caixa_diario_profissional ON public.caixa_diario(profissional_id);

-- RLS para planos de saúde
ALTER TABLE public.planos_saude ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar planos do próprio tenant"
  ON public.planos_saude FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins podem gerenciar planos"
  ON public.planos_saude FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS para caixa diário
ALTER TABLE public.caixa_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar caixa"
  ON public.caixa_diario FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Profissionais autorizados podem visualizar caixa"
  ON public.caixa_diario FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    ) AND (
      profissional_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'recepcao')
      )
    )
  );

CREATE POLICY "Recepção e admin podem inserir no caixa"
  ON public.caixa_diario FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'recepcao')
  ));

CREATE POLICY "Admins podem atualizar caixa"
  ON public.caixa_diario FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins podem deletar do caixa"
  ON public.caixa_diario FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_planos_saude_updated_at
  BEFORE UPDATE ON public.planos_saude
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_caixa_diario_updated_at
  BEFORE UPDATE ON public.caixa_diario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();