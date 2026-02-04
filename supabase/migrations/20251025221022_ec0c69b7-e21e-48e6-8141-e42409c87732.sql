-- Auditoria detalhada por mensagem
CREATE TABLE IF NOT EXISTS public.message_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  message_id UUID REFERENCES public.log_mensagens(id) ON DELETE SET NULL,
  rota TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL, -- 'user', 'system', 'automation'
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_hash TEXT NOT NULL,
  payload_preview JSONB, -- Apenas preview, não dados sensíveis
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_audit_tenant ON public.message_audit(tenant_id);
CREATE INDEX idx_message_audit_timestamp ON public.message_audit(timestamp);
CREATE INDEX idx_message_audit_actor ON public.message_audit(actor_id);
CREATE INDEX idx_message_audit_message ON public.message_audit(message_id);

-- Consentimentos LGPD
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contact_id UUID NOT NULL, -- paciente_id
  contact_type TEXT NOT NULL DEFAULT 'paciente',
  consent_type TEXT NOT NULL, -- 'marketing', 'operational', 'research'
  status TEXT NOT NULL, -- 'opted_in', 'opted_out', 'pending'
  origin TEXT NOT NULL, -- 'portal', 'whatsapp', 'assinatura', 'verbal', 'email'
  term_version TEXT NOT NULL,
  term_url TEXT,
  given_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_tenant ON public.consent_records(tenant_id);
CREATE INDEX idx_consent_contact ON public.consent_records(contact_id, contact_type);
CREATE INDEX idx_consent_status ON public.consent_records(status);
CREATE INDEX idx_consent_type ON public.consent_records(consent_type);

-- Políticas de retenção configuráveis
CREATE TABLE IF NOT EXISTS public.retention_policies_detailed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  policy_name TEXT NOT NULL,
  target_table TEXT NOT NULL,
  retention_months INTEGER NOT NULL,
  apply_to_status TEXT[], -- filtros específicos
  last_applied_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_retention_policies_tenant ON public.retention_policies_detailed(tenant_id);
CREATE INDEX idx_retention_policies_active ON public.retention_policies_detailed(active);

-- RLS Policies
ALTER TABLE public.message_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies_detailed ENABLE ROW LEVEL SECURITY;

-- Message audit policies
CREATE POLICY "System can insert message audit"
  ON public.message_audit FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Support can view all message audit"
  ON public.message_audit FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own message audit"
  ON public.message_audit FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Consent policies
CREATE POLICY "System can manage consent records"
  ON public.consent_records FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Support can view all consent records"
  ON public.consent_records FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own consent records"
  ON public.consent_records FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Retention policies
CREATE POLICY "Master can manage retention policies"
  ON public.retention_policies_detailed FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

CREATE POLICY "Support can view retention policies"
  ON public.retention_policies_detailed FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own retention policies"
  ON public.retention_policies_detailed FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ) OR tenant_id IS NULL);

-- Function para verificar consentimento válido
CREATE OR REPLACE FUNCTION public.has_valid_consent(
  p_tenant_id UUID,
  p_contact_id UUID,
  p_consent_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.consent_records
    WHERE tenant_id = p_tenant_id
      AND contact_id = p_contact_id
      AND consent_type = p_consent_type
      AND status = 'opted_in'
      AND (expires_at IS NULL OR expires_at > now())
      AND revoked_at IS NULL
  );
END;
$$;

-- Function para anonimizar contato (LGPD)
CREATE OR REPLACE FUNCTION public.anonymize_patient_data(
  p_tenant_id UUID,
  p_patient_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_random_id TEXT;
BEGIN
  v_random_id := 'ANON_' || substring(gen_random_uuid()::text, 1, 8);
  
  -- Anonimizar dados do paciente
  UPDATE public.pacientes
  SET 
    nome = 'ANONIMIZADO',
    email = v_random_id || '@anonimizado.local',
    telefone = 'REMOVIDO',
    notas_internas = 'Dados anonimizados em ' || now() || ' (LGPD)',
    consentimento_lgpd = false,
    consentimento_data = NULL
  WHERE id = p_patient_id
    AND tenant_id = p_tenant_id;
  
  -- Registrar na auditoria
  INSERT INTO public.auditoria (
    tenant_id,
    usuario_id,
    acao,
    tabela,
    registro_id,
    dados_anteriores,
    created_at
  ) VALUES (
    p_tenant_id,
    auth.uid(),
    'anonymize',
    'pacientes',
    p_patient_id,
    jsonb_build_object('reason', 'LGPD', 'timestamp', now()),
    now()
  );
  
  -- Revogar todos os consentimentos
  UPDATE public.consent_records
  SET 
    status = 'opted_out',
    revoked_at = now(),
    updated_at = now()
  WHERE tenant_id = p_tenant_id
    AND contact_id = p_patient_id;
    
  -- Log na auditoria admin
  INSERT INTO public.auditoria_admin (
    tipo_evento,
    descricao,
    metadata
  ) VALUES (
    'data_anonymization',
    'Dados de paciente anonimizados (LGPD)',
    jsonb_build_object(
      'tenant_id', p_tenant_id,
      'patient_id', p_patient_id,
      'timestamp', now()
    )
  );
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_consent_records_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_consent_records_updated_at_trigger
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_records_updated_at();

CREATE TRIGGER update_retention_policies_updated_at_trigger
  BEFORE UPDATE ON public.retention_policies_detailed
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir políticas de retenção padrão
INSERT INTO public.retention_policies_detailed (
  policy_name,
  target_table,
  retention_months,
  description,
  active
) VALUES
  ('Mensagens - Retenção Padrão', 'log_mensagens', 24, 'Retenção de mensagens por 24 meses', true),
  ('Auditoria Admin - Retenção Padrão', 'auditoria_admin', 36, 'Retenção de logs de auditoria por 36 meses', true),
  ('Auditoria de Mensagens - Retenção Padrão', 'message_audit', 36, 'Retenção de auditoria de mensagens por 36 meses', true),
  ('Logs do Sistema - Retenção Padrão', 'system_logs', 12, 'Retenção de logs do sistema por 12 meses', true)
ON CONFLICT DO NOTHING;