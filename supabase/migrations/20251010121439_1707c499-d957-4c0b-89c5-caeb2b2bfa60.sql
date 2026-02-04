-- Adicionar coluna status na tabela tenants se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'tenants' 
                AND column_name = 'status') THEN
    ALTER TABLE public.tenants 
    ADD COLUMN status tenant_status DEFAULT 'ativo';
  END IF;
END $$;

-- Adicionar colunas faltantes na tabela usuarios_suporte
ALTER TABLE public.usuarios_suporte 
ADD COLUMN IF NOT EXISTS senha_temporaria text,
ADD COLUMN IF NOT EXISTS ultimo_acesso timestamp with time zone;

-- Criar função para resetar senha de usuário de suporte
CREATE OR REPLACE FUNCTION public.reset_support_user_password(
  p_usuario_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Pegar auth_user_id
  SELECT auth_user_id INTO v_auth_user_id
  FROM public.usuarios_suporte
  WHERE id = p_usuario_id;
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário de suporte não encontrado';
  END IF;
  
  -- Atualizar flag para forçar troca de senha
  UPDATE public.usuarios_suporte
  SET forcar_troca_senha = true
  WHERE id = p_usuario_id;
  
  -- Registrar ação na auditoria
  INSERT INTO public.auditoria_admin (
    tipo_evento,
    descricao,
    metadata
  ) VALUES (
    'password_reset',
    'Reset de senha solicitado',
    jsonb_build_object('usuario_id', p_usuario_id)
  );
END;
$$;