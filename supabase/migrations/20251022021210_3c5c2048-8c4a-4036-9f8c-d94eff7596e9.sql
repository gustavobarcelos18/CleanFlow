-- ETAPA 7/8: Observabilidade, Relatórios, Segurança Extra

-- 1. Tabela de métricas diárias
CREATE TABLE IF NOT EXISTS public.support_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id),
  tickets_abertos integer DEFAULT 0,
  tickets_fechados integer DEFAULT 0,
  tempo_medio_primeira_resposta_minutos integer DEFAULT 0,
  slas_estourados integer DEFAULT 0,
  chats_iniciados integer DEFAULT 0,
  chats_finalizados integer DEFAULT 0,
  tempo_medio_resolucao_horas numeric(10,2) DEFAULT 0,
  taxa_satisfacao numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(data, tenant_id)
);

ALTER TABLE public.support_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view all metrics"
  ON public.support_metrics FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Master can manage metrics"
  ON public.support_metrics FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

-- 2. Logs estruturados com request-id
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  tenant_id uuid,
  service text,
  status_code integer,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_system_logs_request_id ON public.system_logs(request_id);
CREATE INDEX idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_status_code ON public.system_logs(status_code);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view logs"
  ON public.system_logs FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "System can insert logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (true);

-- 3. Dashboard de erros (métricas de erros HTTP)
CREATE TABLE IF NOT EXISTS public.error_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  status_code integer NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  tenant_id uuid,
  user_id uuid,
  error_message text,
  stack_trace text,
  request_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_error_metrics_timestamp ON public.error_metrics(timestamp DESC);
CREATE INDEX idx_error_metrics_status_code ON public.error_metrics(status_code);

ALTER TABLE public.error_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view error metrics"
  ON public.error_metrics FOR SELECT
  USING (has_support_access(auth.uid()));

-- 4. Tentativas de login (segurança)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address, created_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view login attempts"
  ON public.login_attempts FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "System can insert login attempts"
  ON public.login_attempts FOR INSERT
  WITH CHECK (true);

-- 5. Bloqueios de conta
CREATE TABLE IF NOT EXISTS public.account_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz NOT NULL,
  reason text NOT NULL,
  failed_attempts integer DEFAULT 0,
  alert_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view account locks"
  ON public.account_locks FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Master can manage account locks"
  ON public.account_locks FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

-- 6. Configurações de 2FA
CREATE TABLE IF NOT EXISTS public.user_2fa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean DEFAULT false,
  method text CHECK (method IN ('totp', 'sms', 'email')),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2FA settings"
  ON public.user_2fa_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own 2FA settings"
  ON public.user_2fa_settings FOR ALL
  USING (user_id = auth.uid());

-- 7. Políticas de retenção de dados
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  retention_months integer NOT NULL,
  description text,
  last_cleanup_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir políticas padrão
INSERT INTO public.data_retention_policies (table_name, retention_months, description) VALUES
  ('support_tickets', 24, 'Tickets de suporte: 24 meses'),
  ('support_chat_sessions', 12, 'Sessões de chat: 12 meses'),
  ('auditoria_admin', 36, 'Auditoria admin: 36 meses'),
  ('system_logs', 6, 'Logs do sistema: 6 meses'),
  ('error_metrics', 12, 'Métricas de erros: 12 meses')
ON CONFLICT (table_name) DO NOTHING;

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view retention policies"
  ON public.data_retention_policies FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Master can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

-- 8. Auditoria de exportações
CREATE TABLE IF NOT EXISTS public.export_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  export_type text NOT NULL,
  table_name text,
  filters jsonb DEFAULT '{}'::jsonb,
  record_count integer,
  file_format text,
  file_size_bytes bigint,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_export_audit_user_id ON public.export_audit(user_id, created_at DESC);
CREATE INDEX idx_export_audit_created_at ON public.export_audit(created_at DESC);

ALTER TABLE public.export_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view export audit"
  ON public.export_audit FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Users can insert own export audit"
  ON public.export_audit FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 9. Solicitações de anonimização (LGPD)
CREATE TABLE IF NOT EXISTS public.anonymization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contact_type text NOT NULL CHECK (contact_type IN ('paciente', 'usuario', 'tenant_contato')),
  contact_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.anonymization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view anonymization requests"
  ON public.anonymization_requests FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Master can manage anonymization requests"
  ON public.anonymization_requests FOR ALL
  USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

-- 10. Função para verificar bloqueio de conta
CREATE OR REPLACE FUNCTION public.check_account_lock(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.account_locks
    WHERE email = p_email
      AND locked_until > now()
  ) INTO v_locked;
  
  RETURN v_locked;
END;
$$;

-- 11. Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email text,
  p_success boolean,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_failure_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_count integer;
  v_lock_until timestamptz;
BEGIN
  -- Inserir tentativa
  INSERT INTO public.login_attempts (
    email, 
    success, 
    ip_address, 
    user_agent, 
    failure_reason
  ) VALUES (
    p_email,
    p_success,
    p_ip_address,
    p_user_agent,
    p_failure_reason
  );
  
  -- Se falhou, verificar se precisa bloquear
  IF NOT p_success THEN
    -- Contar falhas nos últimos 15 minutos
    SELECT COUNT(*) INTO v_failed_count
    FROM public.login_attempts
    WHERE email = p_email
      AND success = false
      AND created_at > now() - interval '15 minutes';
    
    -- Se >= 5 falhas, bloquear por 30 minutos
    IF v_failed_count >= 5 THEN
      v_lock_until := now() + interval '30 minutes';
      
      INSERT INTO public.account_locks (
        email,
        locked_until,
        reason,
        failed_attempts
      ) VALUES (
        p_email,
        v_lock_until,
        'Múltiplas tentativas de login falhadas',
        v_failed_count
      )
      ON CONFLICT (email) DO UPDATE SET
        locked_until = v_lock_until,
        failed_attempts = v_failed_count,
        alert_sent = false,
        updated_at = now();
    END IF;
  END IF;
END;
$$;

-- 12. Função para anonimizar dados (LGPD)
CREATE OR REPLACE FUNCTION public.anonymize_contact_data(
  p_request_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Buscar solicitação
  SELECT * INTO v_request
  FROM public.anonymization_requests
  WHERE id = p_request_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Atualizar status
  UPDATE public.anonymization_requests
  SET status = 'processing', updated_at = now()
  WHERE id = p_request_id;
  
  -- Anonimizar baseado no tipo
  IF v_request.contact_type = 'paciente' THEN
    UPDATE public.pacientes
    SET 
      nome = 'ANONIMIZADO',
      email = 'anonimizado_' || gen_random_uuid() || '@deleted.local',
      telefone = 'REMOVIDO',
      notas_internas = 'Dados anonimizados em ' || now()
    WHERE id = v_request.contact_id
      AND tenant_id = v_request.tenant_id;
  END IF;
  
  -- Marcar como completo
  UPDATE public.anonymization_requests
  SET 
    status = 'completed',
    processed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;
  
EXCEPTION WHEN OTHERS THEN
  UPDATE public.anonymization_requests
  SET 
    status = 'failed',
    error_message = SQLERRM,
    updated_at = now()
  WHERE id = p_request_id;
  
  RAISE;
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_support_metrics_updated_at
  BEFORE UPDATE ON public.support_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_locks_updated_at
  BEFORE UPDATE ON public.account_locks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_2fa_settings_updated_at
  BEFORE UPDATE ON public.user_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON public.data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anonymization_requests_updated_at
  BEFORE UPDATE ON public.anonymization_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();