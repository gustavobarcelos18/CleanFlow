-- Adicionar coluna de tema na tabela profiles
-- Para rodar no Supabase Dashboard > SQL Editor

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark' 
CHECK (theme IN ('light', 'dark', 'system'));

COMMENT ON COLUMN public.profiles.theme IS 'Preferência de tema do usuário: light, dark ou system';
