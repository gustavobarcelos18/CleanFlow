-- SECURITY FIX: Restrict patient data access to authorized medical staff only
DROP POLICY IF EXISTS "Users can view tenant patients" ON pacientes;

CREATE POLICY "Medical staff can view patients" ON pacientes
FOR SELECT USING (
  tenant_id IN (
    SELECT profiles.tenant_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'profissional', 'recepcao')
  )
);

-- SECURITY FIX: Ensure agenda (appointments) follows same pattern
DROP POLICY IF EXISTS "Users can view tenant appointments" ON agenda;

CREATE POLICY "Medical staff can view appointments" ON agenda
FOR SELECT USING (
  tenant_id IN (
    SELECT profiles.tenant_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'profissional', 'recepcao')
  )
);

-- SECURITY FIX: Restrict message logs to medical staff only
DROP POLICY IF EXISTS "Users can view tenant message logs" ON log_mensagens;

CREATE POLICY "Medical staff can view message logs" ON log_mensagens
FOR SELECT USING (
  tenant_id IN (
    SELECT profiles.tenant_id FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'profissional', 'recepcao')
  )
);