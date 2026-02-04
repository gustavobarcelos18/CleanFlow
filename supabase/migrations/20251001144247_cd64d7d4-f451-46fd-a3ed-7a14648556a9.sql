-- Criar tabela de alertas de risco
CREATE TABLE IF NOT EXISTS public.alertas_risco (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  tipo text NOT NULL, -- 'no_show_risco', 'confirmacao_pendente', 'atraso', 'outro'
  prioridade text NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
  titulo text NOT NULL,
  descricao text,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  agendamento_id uuid REFERENCES public.agenda(id) ON DELETE CASCADE,
  resolvido boolean DEFAULT false,
  resolvido_em timestamp with time zone,
  resolvido_por uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.alertas_risco ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Staff can view alerts"
ON public.alertas_risco
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid() 
    AND role IN ('admin', 'profissional', 'recepcao')
  )
);

CREATE POLICY "Staff can manage alerts"
ON public.alertas_risco
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid() 
    AND role IN ('admin', 'profissional', 'recepcao')
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_alertas_risco_updated_at
BEFORE UPDATE ON public.alertas_risco
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para performance
CREATE INDEX idx_alertas_risco_tenant ON public.alertas_risco(tenant_id);
CREATE INDEX idx_alertas_risco_paciente ON public.alertas_risco(paciente_id);
CREATE INDEX idx_alertas_risco_resolvido ON public.alertas_risco(resolvido);
CREATE INDEX idx_alertas_risco_prioridade ON public.alertas_risco(prioridade);