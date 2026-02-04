-- Migration: Add theme preference to system_users
-- Description: Adiciona campo para armazenar preferência de tema (claro/escuro) do usuário de suporte

-- Adicionar coluna theme_preference à tabela system_users
ALTER TABLE system_users 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark'));

-- Comentário na coluna
COMMENT ON COLUMN system_users.theme_preference IS 'Preferência de tema do usuário (light ou dark)';
