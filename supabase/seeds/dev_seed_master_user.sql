-- SEED OPCIONAL DE DESENVOLVIMENTO
-- Use este script APENAS em ambiente de desenvolvimento para criar um usuário master.
-- Substitua 'SEU_EMAIL_AQUI' e 'SUA_SENHA_AQUI' pelos valores desejados.

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'SEU_EMAIL_AQUI'; -- SUBSTITUA AQUI
  v_password text := 'SUA_SENHA_AQUI'; -- SUBSTITUA AQUI
BEGIN
  -- 1. Verificar/Criar usuário no auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
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
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Master Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO v_user_id;
  END IF;

  -- 2. Garantir registro em usuarios_suporte (ou system_users dependendo da versão)
  -- Tentando inserir em usuarios_suporte (tabela mais recente usada nos scripts)
  BEGIN
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
      v_email,
      'ativo',
      ARRAY['master']::support_role[],
      'claro',
      false
    )
    ON CONFLICT (email) DO UPDATE SET
      funcoes = ARRAY['master']::support_role[],
      status = 'ativo';
  EXCEPTION WHEN undefined_table THEN
    -- Fallback para system_users se usuarios_suporte não existir
    NULL; 
  END;

  -- Tentando inserir em system_users (se existir)
  BEGIN
    INSERT INTO public.system_users (
      id,
      system_role,
      active
    ) VALUES (
      v_user_id,
      'master',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      system_role = 'master',
      active = true;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

END $$;
