-- Criar usuário master no auth.users se não existir
-- Criar usuário master no auth.users se não existir
/*
REMOVIDO POR SEGURANÇA - Use supabase/seeds/dev_seed_master_user.sql em DEV
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verificar se o usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'barcelos32@gmail.com';
  
  -- Se não existe, criar o usuário
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
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
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"nome": "Master Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO v_user_id;
    
    -- Criar registro em usuarios_suporte
    INSERT INTO public.usuarios_suporte (
      auth_user_id,
      nome,
      email,
      status,
      funcoes,
      tema,
      forcar_troca_senha
    ) VALUES (
      v_user_id,
      'Master Admin',
      'barcelos32@gmail.com',
      'ativo',
      ARRAY['master']::support_role[],
      'claro',
      true
    );
  ELSE
    -- Se o usuário já existe, garantir que exista em usuarios_suporte
    INSERT INTO public.usuarios_suporte (
      auth_user_id,
      nome,
      email,
      status,
      funcoes,
      tema,
      forcar_troca_senha
    )
    SELECT 
      v_user_id,
      'Master Admin',
      'barcelos32@gmail.com',
      'ativo',
      ARRAY['master']::support_role[],
      'claro',
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.usuarios_suporte WHERE auth_user_id = v_user_id
    );
  END IF;
END $$;
*/