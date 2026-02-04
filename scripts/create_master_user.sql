-- Script para criar usuário master admin no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard (https://supabase.com/dashboard)

-- 1. Primeiro, crie o usuário via Authentication > Users > Add User
--    Email: gustavo@cleanflow.local (ou outro email de sua preferência)
--    Password: xpto1234
--    Após criar, copie o UUID do usuário criado

-- 2. Depois execute o SQL abaixo substituindo 'SUBSTITUA_PELO_UUID_DO_USUARIO' pelo UUID real:

-- Inserir na tabela system_users como master
INSERT INTO public.system_users (
    id,
    email,
    nome,
    role,
    active,
    theme_preference,
    created_at,
    updated_at
) VALUES (
    'SUBSTITUA_PELO_UUID_DO_USUARIO'::uuid,
    'gustavo@cleanflow.local',
    'Gustavo',
    'master',
    true,
    'system',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'master',
    active = true,
    updated_at = now();

-- Verificar se foi criado corretamente:
-- SELECT * FROM system_users WHERE email LIKE '%gustavo%';
