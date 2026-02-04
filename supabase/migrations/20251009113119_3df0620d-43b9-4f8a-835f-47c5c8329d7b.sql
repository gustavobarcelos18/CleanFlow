-- Create enum for support user roles
CREATE TYPE support_role AS ENUM ('master', 'admin', 'agente', 'financeiro', 'leitura');

-- Create enum for user status
CREATE TYPE user_status AS ENUM ('ativo', 'suspenso', 'pendente');

-- Create enum for tenant status
CREATE TYPE tenant_status AS ENUM ('ativo', 'suspenso', 'trial');

-- Create enum for theme preference
CREATE TYPE theme_preference AS ENUM ('claro', 'escuro');

-- Create support users table (usuarios_suporte)
CREATE TABLE public.usuarios_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  status user_status NOT NULL DEFAULT 'ativo',
  funcoes support_role[] NOT NULL DEFAULT ARRAY['leitura']::support_role[],
  tema theme_preference NOT NULL DEFAULT 'claro',
  forcar_troca_senha BOOLEAN NOT NULL DEFAULT false,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenant support contacts table
CREATE TABLE public.tenant_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  contatos_suporte JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Create user-tenant binding table (vinculo_usuario_tenant)
CREATE TABLE public.vinculo_usuario_tenant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios_suporte(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  papeis_no_tenant support_role[] NOT NULL DEFAULT ARRAY['leitura']::support_role[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, tenant_id)
);

-- Create admin audit log table
CREATE TABLE public.auditoria_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios_suporte(id) ON DELETE SET NULL,
  tipo_evento TEXT NOT NULL,
  descricao TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usuarios_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculo_usuario_tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_admin ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios_suporte
CREATE POLICY "Master and admin can view all support users"
ON public.usuarios_suporte FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_suporte us
    WHERE us.auth_user_id = auth.uid()
    AND us.status = 'ativo'
    AND ('master' = ANY(us.funcoes) OR 'admin' = ANY(us.funcoes))
  )
);

CREATE POLICY "Master and admin can manage support users"
ON public.usuarios_suporte FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_suporte us
    WHERE us.auth_user_id = auth.uid()
    AND us.status = 'ativo'
    AND ('master' = ANY(us.funcoes) OR 'admin' = ANY(us.funcoes))
  )
);

CREATE POLICY "Users can view own profile"
ON public.usuarios_suporte FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.usuarios_suporte FOR UPDATE
USING (auth_user_id = auth.uid());

-- RLS Policies for tenant_suporte
CREATE POLICY "Support users can view tenant support info"
ON public.tenant_suporte FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_suporte us
    WHERE us.auth_user_id = auth.uid()
    AND us.status = 'ativo'
  )
);

CREATE POLICY "Master and admin can manage tenant support"
ON public.tenant_suporte FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_suporte us
    WHERE us.auth_user_id = auth.uid()
    AND us.status = 'ativo'
    AND ('master' = ANY(us.funcoes) OR 'admin' = ANY(us.funcoes))
  )
);

-- RLS Policies for vinculo_usuario_tenant
CREATE POLICY "Support users can view own bindings"
ON public.vinculo_usuario_tenant FOR SELECT
USING (
  usuario_id IN (
    SELECT id FROM public.usuarios_suporte
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Master and admin can manage all bindings"
ON public.vinculo_usuario_tenant FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_suporte us
    WHERE us.auth_user_id = auth.uid()
    AND us.status = 'ativo'
    AND ('master' = ANY(us.funcoes) OR 'admin' = ANY(us.funcoes))
  )
);

-- RLS Policies for auditoria_admin
CREATE POLICY "Master and admin can view audit logs"
ON public.auditoria_admin FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_suporte us
    WHERE us.auth_user_id = auth.uid()
    AND us.status = 'ativo'
    AND ('master' = ANY(us.funcoes) OR 'admin' = ANY(us.funcoes))
  )
);

CREATE POLICY "System can insert audit logs"
ON public.auditoria_admin FOR INSERT
WITH CHECK (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_usuarios_suporte_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER usuarios_suporte_updated_at
BEFORE UPDATE ON public.usuarios_suporte
FOR EACH ROW
EXECUTE FUNCTION update_usuarios_suporte_updated_at();

-- Create trigger for tenant_suporte updated_at
CREATE TRIGGER tenant_suporte_updated_at
BEFORE UPDATE ON public.tenant_suporte
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_usuarios_suporte_email ON public.usuarios_suporte(email);
CREATE INDEX idx_usuarios_suporte_auth_user_id ON public.usuarios_suporte(auth_user_id);
CREATE INDEX idx_usuarios_suporte_status ON public.usuarios_suporte(status);
CREATE INDEX idx_vinculo_usuario_tenant_usuario_id ON public.vinculo_usuario_tenant(usuario_id);
CREATE INDEX idx_vinculo_usuario_tenant_tenant_id ON public.vinculo_usuario_tenant(tenant_id);
CREATE INDEX idx_auditoria_admin_usuario_id ON public.auditoria_admin(usuario_id);
CREATE INDEX idx_auditoria_admin_tipo_evento ON public.auditoria_admin(tipo_evento);
CREATE INDEX idx_auditoria_admin_created_at ON public.auditoria_admin(created_at DESC);