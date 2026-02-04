-- Adicionar coluna sidebar_width à tabela user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS sidebar_width INTEGER DEFAULT 256;