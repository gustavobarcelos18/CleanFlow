-- Tabela para controlar preferências de tour guiado dos usuários
CREATE TABLE IF NOT EXISTS public.user_tour_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_slug text NOT NULL,
  tour_completed boolean DEFAULT false,
  tour_disabled boolean DEFAULT false,
  last_shown_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, page_slug)
);

-- Habilitar RLS
ALTER TABLE public.user_tour_preferences ENABLE ROW LEVEL SECURITY;

-- Policies para user_tour_preferences
CREATE POLICY "Users can view their own tour preferences"
  ON public.user_tour_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tour preferences"
  ON public.user_tour_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Tabela de planos (plans já existe, vamos usar ela)
-- Vamos apenas garantir que ela está acessível para todos lerem

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_tour_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tour_preferences_updated_at
  BEFORE UPDATE ON public.user_tour_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tour_preferences_updated_at();