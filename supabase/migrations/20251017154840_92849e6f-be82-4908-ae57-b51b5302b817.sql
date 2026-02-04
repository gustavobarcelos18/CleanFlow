-- Adicionar política RLS para permitir que usuários do mesmo tenant
-- visualizem os perfis de profissionais

-- Criar política para visualizar profissionais do mesmo tenant
CREATE POLICY "Users can view professionals in same tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND role = 'profissional'
);