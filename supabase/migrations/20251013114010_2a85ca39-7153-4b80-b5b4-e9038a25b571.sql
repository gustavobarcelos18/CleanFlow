-- Adicionar campos de preferências aos usuários de suporte
ALTER TABLE public.usuarios_suporte 
ADD COLUMN IF NOT EXISTS dashboard_filters JSONB DEFAULT '{}';

-- Criar índice para busca por tema
CREATE INDEX IF NOT EXISTS idx_usuarios_suporte_tema ON public.usuarios_suporte(tema);

-- Atualizar tipo de tema se necessário
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_preference') THEN
    CREATE TYPE theme_preference AS ENUM ('claro', 'escuro', 'sistema');
  END IF;
END $$;

-- Auditoria de alterações de preferências do dashboard
CREATE TABLE IF NOT EXISTS public.support_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_user_id UUID NOT NULL REFERENCES auth.users(id),
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_prefs_user ON public.support_dashboard_preferences(support_user_id);

ALTER TABLE public.support_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dashboard preferences"
  ON public.support_dashboard_preferences
  FOR ALL
  TO authenticated
  USING (support_user_id = auth.uid())
  WITH CHECK (support_user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_dashboard_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_dashboard_prefs_timestamp
  BEFORE UPDATE ON public.support_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_prefs_updated_at();