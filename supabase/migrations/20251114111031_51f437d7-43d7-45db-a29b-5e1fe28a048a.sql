-- Criar tabela de prontuários se não existir
CREATE TABLE IF NOT EXISTS public.prontuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL,
  agendamento_id UUID REFERENCES public.agenda(id) ON DELETE SET NULL,
  data_atendimento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Dados SOAP
  subjetivo TEXT,
  objetivo TEXT,
  avaliacao TEXT,
  plano TEXT,
  
  -- Sinais vitais
  pressao_arterial TEXT,
  frequencia_cardiaca INTEGER,
  temperatura NUMERIC(4,1),
  peso NUMERIC(5,2),
  altura NUMERIC(4,2),
  imc NUMERIC(4,2),
  saturacao_o2 INTEGER,
  
  -- Diagnóstico
  cid10_principal TEXT,
  cid10_secundarios TEXT[],
  hipotese_diagnostica TEXT,
  
  -- Prescrições e exames
  prescricoes JSONB DEFAULT '[]'::jsonb,
  exames_solicitados JSONB DEFAULT '[]'::jsonb,
  
  -- Anamnese (para primeiro atendimento)
  queixa_principal TEXT,
  historia_doenca_atual TEXT,
  historia_pregressa TEXT,
  alergias TEXT[],
  medicamentos_uso TEXT[],
  historia_familiar TEXT,
  historia_social TEXT,
  
  -- Status e metadados
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizado', 'assinado')),
  observacoes TEXT,
  evolucao TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMP WITH TIME ZONE,
  assinado_em TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prontuarios_tenant_id ON public.prontuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente_id ON public.prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_profissional_id ON public.prontuarios(profissional_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_data_atendimento ON public.prontuarios(data_atendimento DESC);
CREATE INDEX IF NOT EXISTS idx_prontuarios_agendamento_id ON public.prontuarios(agendamento_id) WHERE agendamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prontuarios_tenant_paciente ON public.prontuarios(tenant_id, paciente_id, data_atendimento DESC);
CREATE INDEX IF NOT EXISTS idx_prontuarios_tenant_profissional ON public.prontuarios(tenant_id, profissional_id, data_atendimento DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_prontuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_prontuarios_updated_at ON public.prontuarios;
CREATE TRIGGER trigger_prontuarios_updated_at
  BEFORE UPDATE ON public.prontuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_prontuarios_updated_at();

-- Trigger para atualizar status do agendamento quando prontuário é finalizado
CREATE OR REPLACE FUNCTION update_agenda_status_on_prontuario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finalizado' AND OLD.status != 'finalizado' AND NEW.agendamento_id IS NOT NULL THEN
    UPDATE public.agenda
    SET status = 'realizado'::appointment_status
    WHERE id = NEW.agendamento_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_agenda_on_prontuario ON public.prontuarios;
CREATE TRIGGER trigger_update_agenda_on_prontuario
  AFTER UPDATE ON public.prontuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_agenda_status_on_prontuario();

-- RLS Policies
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;

-- Profissionais podem ver seus próprios prontuários
DROP POLICY IF EXISTS "Profissionais podem ver seus prontuários" ON public.prontuarios;
CREATE POLICY "Profissionais podem ver seus prontuários"
  ON public.prontuarios FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND profissional_id = auth.uid()
  );

-- Admins podem ver todos os prontuários do tenant
DROP POLICY IF EXISTS "Admins podem ver todos prontuários" ON public.prontuarios;
CREATE POLICY "Admins podem ver todos prontuários"
  ON public.prontuarios FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Profissionais podem criar prontuários
DROP POLICY IF EXISTS "Profissionais podem criar prontuários" ON public.prontuarios;
CREATE POLICY "Profissionais podem criar prontuários"
  ON public.prontuarios FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND profissional_id = auth.uid()
  );

-- Profissionais podem atualizar seus próprios prontuários
DROP POLICY IF EXISTS "Profissionais podem atualizar seus prontuários" ON public.prontuarios;
CREATE POLICY "Profissionais podem atualizar seus prontuários"
  ON public.prontuarios FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND profissional_id = auth.uid()
  );

-- Índices adicionais para agenda (atendimento do dia)
CREATE INDEX IF NOT EXISTS idx_agenda_profissional_data ON public.agenda(profissional_id, inicio) WHERE status != 'cancelado'::appointment_status;
CREATE INDEX IF NOT EXISTS idx_agenda_tenant_data ON public.agenda(tenant_id, inicio DESC);

-- Comentários para documentação
COMMENT ON TABLE public.prontuarios IS 'Prontuários eletrônicos dos pacientes seguindo padrão SOAP';
COMMENT ON COLUMN public.prontuarios.subjetivo IS 'S do SOAP - queixas e sintomas relatados pelo paciente';
COMMENT ON COLUMN public.prontuarios.objetivo IS 'O do SOAP - achados do exame físico e sinais vitais';
COMMENT ON COLUMN public.prontuarios.avaliacao IS 'A do SOAP - impressão diagnóstica e raciocínio clínico';
COMMENT ON COLUMN public.prontuarios.plano IS 'P do SOAP - conduta terapêutica e orientações';