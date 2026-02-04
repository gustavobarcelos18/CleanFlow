-- Adicionar políticas RLS para permitir visualização de cadastros
-- por usuários do mesmo tenant em todas as tabelas

-- ESPECIALIDADES: Permitir visualizar especialidades do mesmo tenant
CREATE POLICY "Users can view specialties in same tenant"
ON public.especialidades
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- SERVICOS: A política já existe mas vamos garantir consistência
-- (Se der erro, é porque já existe - tudo bem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'servicos' 
    AND policyname = 'Users can view services in same tenant'
  ) THEN
    CREATE POLICY "Users can view services in same tenant"
    ON public.servicos
    FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- EXAMES_PROCEDIMENTOS: A política já existe mas vamos garantir consistência
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exames_procedimentos' 
    AND policyname = 'Users can view exams in same tenant'
  ) THEN
    CREATE POLICY "Users can view exams in same tenant"
    ON public.exames_procedimentos
    FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- PACOTES: A política já existe mas vamos garantir consistência
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pacotes' 
    AND policyname = 'Users can view packages in same tenant'
  ) THEN
    CREATE POLICY "Users can view packages in same tenant"
    ON public.pacotes
    FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
    );
  END IF;
END $$;

-- PACIENTES: A política já existe mas vamos garantir consistência
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pacientes' 
    AND policyname = 'Users can view patients in same tenant'
  ) THEN
    CREATE POLICY "Users can view patients in same tenant"
    ON public.pacientes
    FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id 
        FROM profiles 
        WHERE id = auth.uid()
      )
    );
  END IF;
END $$;