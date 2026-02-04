-- Garantir que o usuário master existe
-- Garantir que o usuário master existe
/*
REMOVIDO POR SEGURANÇA - Use supabase/seeds/dev_seed_master_user.sql em DEV
DO $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Verificar se o usuário já existe no auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'barcelos32@gmail.com';

  -- Se não existe, criar
  IF v_auth_user_id IS NULL THEN
    -- Criar usuário no auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'barcelos32@gmail.com',
      crypt('@Sonyk8000', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Master Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_auth_user_id;
  END IF;

  -- Inserir ou atualizar na tabela usuarios_suporte
  INSERT INTO public.usuarios_suporte (
    auth_user_id,
    nome,
    email,
    status,
    funcoes,
    tema,
    forcar_troca_senha
  ) VALUES (
    v_auth_user_id,
    'Master Admin',
    'barcelos32@gmail.com',
    'ativo',
    ARRAY['master']::support_role[],
    'claro',
    false
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    nome = EXCLUDED.nome,
    status = EXCLUDED.status,
    funcoes = EXCLUDED.funcoes,
    forcar_troca_senha = false,
    updated_at = now();
END $$;
*/