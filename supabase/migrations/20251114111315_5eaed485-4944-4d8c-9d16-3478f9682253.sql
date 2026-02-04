-- Corrigir trigger para usar status correto
DROP TRIGGER IF EXISTS trigger_update_agenda_on_prontuario ON public.prontuarios;
DROP FUNCTION IF EXISTS update_agenda_status_on_prontuario();

CREATE OR REPLACE FUNCTION update_agenda_status_on_prontuario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finalizado' AND OLD.status != 'finalizado' AND NEW.agendamento_id IS NOT NULL THEN
    UPDATE public.agenda
    SET status = 'concluido'::appointment_status
    WHERE id = NEW.agendamento_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_agenda_on_prontuario
  AFTER UPDATE ON public.prontuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_agenda_status_on_prontuario();