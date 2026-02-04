-- Insert master user (will need to be created in auth.users first via Supabase Auth)
-- This is a placeholder - the actual auth user will be created via signup
-- After signup, we'll link it to usuarios_suporte table

-- Create function to handle new admin user creation
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user should be a support user (based on email)
  -- Check if user should be a support user (based on email)
  /*
  REMOVIDO POR SEGURANÇA - Auto-promoção de admin removida.
  Use o painel administrativo ou seed para promover usuários.
  
  IF NEW.email = 'barcelos32@gmail.com' THEN
    INSERT INTO public.usuarios_suporte (
      auth_user_id,
      nome,
      email,
      status,
      funcoes,
      tema,
      forcar_troca_senha
    ) VALUES (
      NEW.id,
      'Master Admin',
      NEW.email,
      'ativo',
      ARRAY['master']::support_role[],
      'claro',
      true
    );
  END IF;
  */
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create support user on auth signup
CREATE TRIGGER on_auth_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();

-- Create function to log admin authentication events
CREATE OR REPLACE FUNCTION public.log_admin_auth_event(
  p_usuario_id UUID,
  p_tipo_evento TEXT,
  p_descricao TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.auditoria_admin (
    usuario_id,
    tipo_evento,
    descricao,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_usuario_id,
    p_tipo_evento,
    p_descricao,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check if user has support role
CREATE OR REPLACE FUNCTION public.has_support_role(
  p_auth_user_id UUID,
  p_role support_role
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_suporte
    WHERE auth_user_id = p_auth_user_id
    AND status = 'ativo'
    AND p_role = ANY(funcoes)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check if user has any support roles
CREATE OR REPLACE FUNCTION public.has_any_support_role(p_auth_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_suporte
    WHERE auth_user_id = p_auth_user_id
    AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;