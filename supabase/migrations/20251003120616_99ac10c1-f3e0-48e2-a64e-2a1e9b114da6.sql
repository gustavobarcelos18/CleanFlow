-- Add policy to allow support users to manage plans
CREATE POLICY "Support users can manage plans"
ON public.plans
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid()
    AND system_users.system_role IN ('master', 'support')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE system_users.id = auth.uid()
    AND system_users.system_role IN ('master', 'support')
  )
);

-- Drop the old master-only policy
DROP POLICY IF EXISTS "Master users can manage plans" ON public.plans;