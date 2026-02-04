-- Remover função e trigger existentes e recriar com search_path correto
DROP TRIGGER IF EXISTS update_user_tour_preferences_updated_at ON public.user_tour_preferences;
DROP FUNCTION IF EXISTS update_user_tour_preferences_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_user_tour_preferences_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_tour_preferences_updated_at
  BEFORE UPDATE ON public.user_tour_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tour_preferences_updated_at();