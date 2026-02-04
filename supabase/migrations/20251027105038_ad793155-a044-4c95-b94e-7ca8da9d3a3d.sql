-- Tabela de métricas de mensagens
CREATE TABLE IF NOT EXISTS public.whatsapp_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  periodo TIMESTAMPTZ NOT NULL,
  
  -- Métricas de envio
  mensagens_enviadas INTEGER DEFAULT 0,
  mensagens_entregues INTEGER DEFAULT 0,
  mensagens_lidas INTEGER DEFAULT 0,
  mensagens_falhadas INTEGER DEFAULT 0,
  
  -- Taxa de erro por categoria
  erros_rede INTEGER DEFAULT 0,
  erros_template INTEGER DEFAULT 0,
  erros_numero_invalido INTEGER DEFAULT 0,
  erros_bloqueio INTEGER DEFAULT 0,
  erros_outros INTEGER DEFAULT 0,
  
  -- Latência (em ms)
  latencia_p50 INTEGER DEFAULT 0,
  latencia_p95 INTEGER DEFAULT 0,
  latencia_p99 INTEGER DEFAULT 0,
  
  -- TPS (transações por segundo)
  tps_medio NUMERIC DEFAULT 0,
  tps_pico NUMERIC DEFAULT 0,
  
  -- Qualidade
  quality_rating TEXT CHECK (quality_rating IN ('green', 'yellow', 'red', 'unknown')),
  optout_rate NUMERIC DEFAULT 0,
  block_rate NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de rate limits
CREATE TABLE IF NOT EXISTS public.whatsapp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  
  -- Limites
  max_messages_per_minute INTEGER NOT NULL DEFAULT 80,
  max_messages_per_hour INTEGER NOT NULL DEFAULT 1000,
  max_messages_per_day INTEGER NOT NULL DEFAULT 10000,
  
  -- Janela de silêncio
  silence_start_hour INTEGER CHECK (silence_start_hour BETWEEN 0 AND 23),
  silence_end_hour INTEGER CHECK (silence_end_hour BETWEEN 0 AND 23),
  
  -- Freios automáticos
  auto_throttle_enabled BOOLEAN DEFAULT true,
  throttle_on_optout_rate NUMERIC DEFAULT 0.10, -- 10%
  throttle_on_block_rate NUMERIC DEFAULT 0.05,  -- 5%
  
  -- Status atual
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,
  last_reset_minute TIMESTAMPTZ DEFAULT now(),
  last_reset_hour TIMESTAMPTZ DEFAULT now(),
  last_reset_day TIMESTAMPTZ DEFAULT now(),
  is_throttled BOOLEAN DEFAULT false,
  throttle_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone_number)
);

-- Tabela de DLQ (Dead Letter Queue)
CREATE TABLE IF NOT EXISTS public.whatsapp_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  message_id UUID,
  
  -- Dados da mensagem
  to_number TEXT NOT NULL,
  from_number TEXT NOT NULL,
  message_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Tentativas
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Erro
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  is_permanent_failure BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'failed', 'resolved')),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de incidentes
CREATE TABLE IF NOT EXISTS public.whatsapp_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Detalhes do incidente
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  
  -- Métricas do incidente
  affected_tenants INTEGER DEFAULT 0,
  affected_messages INTEGER DEFAULT 0,
  error_rate NUMERIC,
  
  -- Resolução
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.usuarios_suporte(id),
  
  -- Runbook
  runbook_followed BOOLEAN DEFAULT false,
  runbook_steps JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de alarmes
CREATE TABLE IF NOT EXISTS public.whatsapp_alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Tipo de alarme
  alarm_type TEXT NOT NULL CHECK (alarm_type IN ('error_rate', 'template_rejection', 'quality_rating', 'rate_limit', 'delivery_failure')),
  
  -- Condições
  threshold_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.usuarios_suporte(id),
  resolved_at TIMESTAMPTZ,
  
  -- Detalhes
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error', 'critical')),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de reconciliação com Meta
CREATE TABLE IF NOT EXISTS public.whatsapp_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Dados do relatório Meta
  meta_report_data JSONB NOT NULL,
  meta_total_messages INTEGER NOT NULL,
  meta_total_cost NUMERIC NOT NULL,
  
  -- Dados internos
  internal_total_messages INTEGER NOT NULL,
  internal_total_cost NUMERIC NOT NULL,
  
  -- Divergências
  message_difference INTEGER GENERATED ALWAYS AS (meta_total_messages - internal_total_messages) STORED,
  cost_difference NUMERIC GENERATED ALWAYS AS (meta_total_cost - internal_total_cost) STORED,
  has_divergence BOOLEAN GENERATED ALWAYS AS (ABS(meta_total_messages - internal_total_messages) > 0 OR ABS(meta_total_cost - internal_total_cost) > 0.01) STORED,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'corrected', 'approved')),
  reviewed_by UUID REFERENCES public.usuarios_suporte(id),
  reviewed_at TIMESTAMPTZ,
  correction_applied BOOLEAN DEFAULT false,
  
  -- Notas
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, period_start, period_end)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_metrics_tenant_periodo ON public.whatsapp_metrics(tenant_id, periodo DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_metrics_quality ON public.whatsapp_metrics(quality_rating);
CREATE INDEX IF NOT EXISTS idx_whatsapp_rate_limits_tenant ON public.whatsapp_rate_limits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_rate_limits_throttled ON public.whatsapp_rate_limits(is_throttled) WHERE is_throttled = true;
CREATE INDEX IF NOT EXISTS idx_whatsapp_dlq_status ON public.whatsapp_dlq(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_whatsapp_dlq_retry ON public.whatsapp_dlq(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_whatsapp_incidents_status ON public.whatsapp_incidents(status) WHERE status IN ('open', 'investigating');
CREATE INDEX IF NOT EXISTS idx_whatsapp_alarms_status ON public.whatsapp_alarms(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_whatsapp_reconciliation_divergence ON public.whatsapp_reconciliation(has_divergence) WHERE has_divergence = true;

-- Enable RLS
ALTER TABLE public.whatsapp_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_reconciliation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Support can view all metrics"
  ON public.whatsapp_metrics FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can manage metrics"
  ON public.whatsapp_metrics FOR ALL
  USING (has_support_access(auth.uid()));

CREATE POLICY "Tenants can view own metrics"
  ON public.whatsapp_metrics FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Support can manage rate limits"
  ON public.whatsapp_rate_limits FOR ALL
  USING (has_support_access(auth.uid()));

CREATE POLICY "System can update rate limits"
  ON public.whatsapp_rate_limits FOR UPDATE
  USING (true);

CREATE POLICY "Support can view DLQ"
  ON public.whatsapp_dlq FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can manage DLQ"
  ON public.whatsapp_dlq FOR ALL
  USING (has_support_access(auth.uid()));

CREATE POLICY "System can insert to DLQ"
  ON public.whatsapp_dlq FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Support can view all incidents"
  ON public.whatsapp_incidents FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can manage incidents"
  ON public.whatsapp_incidents FOR ALL
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can view all alarms"
  ON public.whatsapp_alarms FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can manage alarms"
  ON public.whatsapp_alarms FOR ALL
  USING (has_support_access(auth.uid()));

CREATE POLICY "System can insert alarms"
  ON public.whatsapp_alarms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Support can view reconciliation"
  ON public.whatsapp_reconciliation FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can manage reconciliation"
  ON public.whatsapp_reconciliation FOR ALL
  USING (has_support_access(auth.uid()));

-- Triggers
CREATE TRIGGER update_whatsapp_metrics_updated_at
  BEFORE UPDATE ON public.whatsapp_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_rate_limits_updated_at
  BEFORE UPDATE ON public.whatsapp_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_dlq_updated_at
  BEFORE UPDATE ON public.whatsapp_dlq
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_incidents_updated_at
  BEFORE UPDATE ON public.whatsapp_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_alarms_updated_at
  BEFORE UPDATE ON public.whatsapp_alarms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_reconciliation_updated_at
  BEFORE UPDATE ON public.whatsapp_reconciliation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_tenant_id UUID,
  p_phone_number TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit RECORD;
  v_now TIMESTAMPTZ := now();
  v_current_hour INTEGER := EXTRACT(HOUR FROM v_now);
BEGIN
  -- Buscar limites
  SELECT * INTO v_limit
  FROM whatsapp_rate_limits
  WHERE tenant_id = p_tenant_id
    AND phone_number = p_phone_number;
  
  IF NOT FOUND THEN
    RETURN true; -- Sem limites configurados, permite
  END IF;
  
  -- Verificar se está throttled
  IF v_limit.is_throttled THEN
    RETURN false;
  END IF;
  
  -- Verificar janela de silêncio
  IF v_limit.silence_start_hour IS NOT NULL AND v_limit.silence_end_hour IS NOT NULL THEN
    IF v_current_hour >= v_limit.silence_start_hour AND v_current_hour < v_limit.silence_end_hour THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Reset contadores se necessário
  IF v_now - v_limit.last_reset_minute > interval '1 minute' THEN
    UPDATE whatsapp_rate_limits
    SET current_minute_count = 0, last_reset_minute = v_now
    WHERE id = v_limit.id;
    v_limit.current_minute_count := 0;
  END IF;
  
  IF v_now - v_limit.last_reset_hour > interval '1 hour' THEN
    UPDATE whatsapp_rate_limits
    SET current_hour_count = 0, last_reset_hour = v_now
    WHERE id = v_limit.id;
    v_limit.current_hour_count := 0;
  END IF;
  
  IF v_now - v_limit.last_reset_day > interval '1 day' THEN
    UPDATE whatsapp_rate_limits
    SET current_day_count = 0, last_reset_day = v_now
    WHERE id = v_limit.id;
    v_limit.current_day_count := 0;
  END IF;
  
  -- Verificar limites
  IF v_limit.current_minute_count >= v_limit.max_messages_per_minute THEN
    RETURN false;
  END IF;
  
  IF v_limit.current_hour_count >= v_limit.max_messages_per_hour THEN
    RETURN false;
  END IF;
  
  IF v_limit.current_day_count >= v_limit.max_messages_per_day THEN
    RETURN false;
  END IF;
  
  -- Incrementar contadores
  UPDATE whatsapp_rate_limits
  SET 
    current_minute_count = current_minute_count + 1,
    current_hour_count = current_hour_count + 1,
    current_day_count = current_day_count + 1
  WHERE id = v_limit.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar alarme
CREATE OR REPLACE FUNCTION create_alarm(
  p_tenant_id UUID,
  p_alarm_type TEXT,
  p_threshold_value NUMERIC,
  p_current_value NUMERIC,
  p_message TEXT,
  p_severity TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_alarm_id UUID;
BEGIN
  INSERT INTO whatsapp_alarms (
    tenant_id,
    alarm_type,
    threshold_value,
    current_value,
    message,
    severity,
    metadata
  ) VALUES (
    p_tenant_id,
    p_alarm_type,
    p_threshold_value,
    p_current_value,
    p_message,
    p_severity,
    p_metadata
  ) RETURNING id INTO v_alarm_id;
  
  -- Log na auditoria
  PERFORM log_system_event(
    'warning',
    'Alarme criado: ' || p_message,
    'whatsapp_monitoring',
    NULL,
    NULL,
    p_tenant_id,
    jsonb_build_object(
      'alarm_id', v_alarm_id,
      'alarm_type', p_alarm_type,
      'severity', p_severity
    )
  );
  
  RETURN v_alarm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;