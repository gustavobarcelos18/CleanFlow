-- Criar trigger para auto-criar profile quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'admin'::user_role,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Criar perfil para o usuário atual (se existir usuário autenticado)
DO $$
DECLARE
  current_user_id uuid;
  current_user_email text;
  new_tenant_id uuid;
BEGIN
  -- Tentar obter o ID do usuário atual da tabela auth.users
  SELECT id, email INTO current_user_id, current_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se encontrou um usuário, criar o perfil se não existir
  IF current_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, nome, email, role, created_at, updated_at)
    VALUES (
      current_user_id,
      current_user_email,
      current_user_email,
      'admin'::user_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Criar um tenant padrão se o usuário não tiver
    INSERT INTO public.tenants (nome, tipo, telefone, cidade, uf, created_at, updated_at)
    VALUES (
      'Minha Clínica',
      'consultorio'::tenant_type,
      '(00) 00000-0000',
      'São Paulo',
      'SP',
      NOW(),
      NOW()
    )
    RETURNING id INTO new_tenant_id;

    -- Associar o tenant ao profile do usuário
    UPDATE public.profiles
    SET tenant_id = new_tenant_id
    WHERE id = current_user_id AND tenant_id IS NULL;
  END IF;
END $$;