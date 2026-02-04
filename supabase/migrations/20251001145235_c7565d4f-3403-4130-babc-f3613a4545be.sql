-- Add read status fields to alertas_risco table
ALTER TABLE public.alertas_risco 
ADD COLUMN IF NOT EXISTS lido boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lido_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS lido_por uuid REFERENCES auth.users(id);

-- Create function to automatically generate alerts based on agenda data
CREATE OR REPLACE FUNCTION public.gerar_alertas_risco()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paciente_record RECORD;
  v_tenant_id uuid;
BEGIN
  -- Get tenant_id from the appointment
  v_tenant_id := NEW.tenant_id;
  
  -- Check for no-show risk (patient with high risk score and unconfirmed appointment)
  IF NEW.status = 'agendado' AND NOT NEW.confirmado THEN
    SELECT * INTO v_paciente_record 
    FROM pacientes 
    WHERE id = NEW.paciente_id;
    
    IF v_paciente_record.risco_no_show >= 70 THEN
      INSERT INTO alertas_risco (
        tenant_id,
        agendamento_id,
        paciente_id,
        tipo,
        prioridade,
        titulo,
        descricao
      ) VALUES (
        v_tenant_id,
        NEW.id,
        NEW.paciente_id,
        'risco_no_show',
        'alta',
        'Alto Risco de Falta',
        'Paciente com ' || v_paciente_record.historico_faltas || ' faltas anteriores e consulta não confirmada'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Check for appointments needing confirmation (24h before)
  IF NEW.status = 'agendado' AND NOT NEW.confirmado AND NEW.inicio <= (now() + interval '24 hours') THEN
    INSERT INTO alertas_risco (
      tenant_id,
      agendamento_id,
      paciente_id,
      tipo,
      prioridade,
      titulo,
      descricao
    ) VALUES (
      v_tenant_id,
      NEW.id,
      NEW.paciente_id,
      'confirmacao_pendente',
      'media',
      'Confirmação Pendente',
      'Consulta em menos de 24h precisa de confirmação'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check for late appointments (started but not completed)
  IF NEW.status = 'agendado' AND NEW.inicio < now() THEN
    INSERT INTO alertas_risco (
      tenant_id,
      agendamento_id,
      paciente_id,
      tipo,
      prioridade,
      titulo,
      descricao
    ) VALUES (
      v_tenant_id,
      NEW.id,
      NEW.paciente_id,
      'atraso',
      'media',
      'Consulta Atrasada',
      'Consulta deveria ter iniciado às ' || to_char(NEW.inicio, 'HH24:MI')
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to generate alerts on agenda changes
DROP TRIGGER IF EXISTS trigger_agenda_alertas ON public.agenda;
CREATE TRIGGER trigger_agenda_alertas
  AFTER INSERT OR UPDATE ON public.agenda
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_alertas_risco();

-- Create index for faster alert queries
CREATE INDEX IF NOT EXISTS idx_alertas_lido_tenant ON public.alertas_risco(tenant_id, lido, created_at DESC);