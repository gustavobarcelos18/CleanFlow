-- Criar políticas RLS para a tabela tenants
-- Permitir que usuários autenticados criem seus próprios tenants
CREATE POLICY "Users can create their own tenant"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuários vejam seus próprios tenants
CREATE POLICY "Users can view their own tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Permitir que admins atualizem seus tenants
CREATE POLICY "Admins can update their tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Criar políticas RLS para a tabela profiles
-- Permitir que usuários criem seu próprio profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Permitir que usuários vejam seus próprios profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Permitir que usuários atualizem seus próprios profiles
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permitir que usuários do mesmo tenant vejam outros profiles
CREATE POLICY "Users can view profiles in same tenant"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);