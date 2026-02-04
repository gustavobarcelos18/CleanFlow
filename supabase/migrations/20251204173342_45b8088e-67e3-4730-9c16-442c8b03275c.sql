-- WhatsApp Outbox table for async message sending
CREATE TABLE IF NOT EXISTS public.whatsapp_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES public.whatsapp_phone_numbers(id),
  to_phone TEXT NOT NULL,
  template_name TEXT,
  template_params JSONB DEFAULT '{}',
  message_body TEXT,
  message_type TEXT NOT NULL DEFAULT 'template' CHECK (message_type IN ('template', 'text', 'media')),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'error', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  external_message_id TEXT,
  consent_type TEXT NOT NULL DEFAULT 'operacional' CHECK (consent_type IN ('operacional', 'marketing', 'transacional')),
  consent_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT whatsapp_outbox_idempotency_unique UNIQUE (tenant_id, idempotency_key)
);

-- Indexes for efficient querying
CREATE INDEX idx_whatsapp_outbox_tenant_status ON public.whatsapp_outbox(tenant_id, status);
CREATE INDEX idx_whatsapp_outbox_status_priority ON public.whatsapp_outbox(status, priority DESC, created_at ASC) WHERE status = 'queued';
CREATE INDEX idx_whatsapp_outbox_retry ON public.whatsapp_outbox(next_retry_at) WHERE status = 'error' AND retries < max_retries;
CREATE INDEX idx_whatsapp_outbox_created ON public.whatsapp_outbox(created_at DESC);

-- WhatsApp send audit log for compliance
CREATE TABLE IF NOT EXISTS public.whatsapp_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  outbox_id UUID REFERENCES public.whatsapp_outbox(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  template_name TEXT,
  message_type TEXT NOT NULL,
  status TEXT NOT NULL,
  external_message_id TEXT,
  consent_type TEXT,
  consent_verified BOOLEAN,
  error_code TEXT,
  error_message TEXT,
  response_data JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_send_log_tenant ON public.whatsapp_send_log(tenant_id, created_at DESC);
CREATE INDEX idx_whatsapp_send_log_phone ON public.whatsapp_send_log(to_phone, created_at DESC);

-- Tenant rate limit configuration (extend existing if needed)
CREATE TABLE IF NOT EXISTS public.tenant_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  max_messages_per_minute INTEGER DEFAULT 30,
  max_messages_per_hour INTEGER DEFAULT 1000,
  max_messages_per_day INTEGER DEFAULT 10000,
  batch_size INTEGER DEFAULT 10,
  retry_delay_seconds INTEGER DEFAULT 60,
  require_consent BOOLEAN DEFAULT true,
  default_consent_type TEXT DEFAULT 'operacional',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_outbox
CREATE POLICY "Tenant isolation for outbox" ON public.whatsapp_outbox
  FOR ALL USING (tenant_id = public.get_user_tenant_id_safe(auth.uid()));

CREATE POLICY "Service role full access outbox" ON public.whatsapp_outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS Policies for whatsapp_send_log
CREATE POLICY "Tenant isolation for send log" ON public.whatsapp_send_log
  FOR SELECT USING (tenant_id = public.get_user_tenant_id_safe(auth.uid()));

CREATE POLICY "Service role full access send log" ON public.whatsapp_send_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS Policies for tenant_whatsapp_config
CREATE POLICY "Tenant isolation for config" ON public.tenant_whatsapp_config
  FOR ALL USING (tenant_id = public.get_user_tenant_id_safe(auth.uid()));

CREATE POLICY "Service role full access config" ON public.tenant_whatsapp_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_outbox_updated_at
  BEFORE UPDATE ON public.whatsapp_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_whatsapp_config_updated_at
  BEFORE UPDATE ON public.tenant_whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to enqueue WhatsApp message with consent verification
CREATE OR REPLACE FUNCTION public.enqueue_whatsapp_message(
  p_tenant_id UUID,
  p_to_phone TEXT,
  p_template_name TEXT,
  p_template_params JSONB DEFAULT '{}',
  p_consent_type TEXT DEFAULT 'operacional',
  p_idempotency_key TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 5,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_consent_valid BOOLEAN;
  v_idempotency_key TEXT;
  v_outbox_id UUID;
  v_patient_id UUID;
BEGIN
  -- Get or create config
  SELECT * INTO v_config FROM tenant_whatsapp_config WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    INSERT INTO tenant_whatsapp_config (tenant_id) VALUES (p_tenant_id)
    RETURNING * INTO v_config;
  END IF;

  -- Generate idempotency key if not provided
  v_idempotency_key := COALESCE(p_idempotency_key, gen_random_uuid()::text);

  -- Check for duplicate
  IF EXISTS (SELECT 1 FROM whatsapp_outbox WHERE tenant_id = p_tenant_id AND idempotency_key = v_idempotency_key) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUPLICATE_MESSAGE',
      'message', 'Mensagem já enfileirada com esta chave de idempotência'
    );
  END IF;

  -- Check consent if required
  v_consent_valid := true;
  IF v_config.require_consent THEN
    -- Try to find patient by phone
    SELECT id INTO v_patient_id FROM pacientes 
    WHERE tenant_id = p_tenant_id AND telefone = p_to_phone
    LIMIT 1;

    IF v_patient_id IS NOT NULL THEN
      v_consent_valid := public.has_valid_consent(p_tenant_id, v_patient_id, p_consent_type);
    END IF;
  END IF;

  -- Insert into outbox
  INSERT INTO whatsapp_outbox (
    tenant_id,
    to_phone,
    template_name,
    template_params,
    message_type,
    idempotency_key,
    consent_type,
    consent_verified,
    priority,
    metadata
  ) VALUES (
    p_tenant_id,
    p_to_phone,
    p_template_name,
    p_template_params,
    'template',
    v_idempotency_key,
    p_consent_type,
    v_consent_valid,
    p_priority,
    p_metadata
  ) RETURNING id INTO v_outbox_id;

  RETURN jsonb_build_object(
    'success', true,
    'outbox_id', v_outbox_id,
    'idempotency_key', v_idempotency_key,
    'consent_verified', v_consent_valid
  );
END;
$$;

-- Function to get next batch of messages to send
CREATE OR REPLACE FUNCTION public.get_whatsapp_outbox_batch(
  p_tenant_id UUID DEFAULT NULL,
  p_batch_size INTEGER DEFAULT 10
) RETURNS SETOF whatsapp_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH batch AS (
    SELECT o.id
    FROM whatsapp_outbox o
    WHERE (p_tenant_id IS NULL OR o.tenant_id = p_tenant_id)
      AND (
        o.status = 'queued'
        OR (o.status = 'error' AND o.retries < o.max_retries AND o.next_retry_at <= now())
      )
      AND o.consent_verified = true
    ORDER BY o.priority DESC, o.created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE whatsapp_outbox
  SET status = 'processing', updated_at = now()
  WHERE id IN (SELECT id FROM batch)
  RETURNING *;
END;
$$;

-- Function to mark message as sent
CREATE OR REPLACE FUNCTION public.mark_whatsapp_sent(
  p_outbox_id UUID,
  p_external_message_id TEXT,
  p_response_data JSONB DEFAULT NULL,
  p_latency_ms INTEGER DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outbox RECORD;
BEGIN
  SELECT * INTO v_outbox FROM whatsapp_outbox WHERE id = p_outbox_id;
  
  UPDATE whatsapp_outbox
  SET 
    status = 'sent',
    sent_at = now(),
    external_message_id = p_external_message_id,
    updated_at = now()
  WHERE id = p_outbox_id;

  -- Log for audit
  INSERT INTO whatsapp_send_log (
    tenant_id,
    outbox_id,
    to_phone,
    template_name,
    message_type,
    status,
    external_message_id,
    consent_type,
    consent_verified,
    response_data,
    latency_ms
  ) VALUES (
    v_outbox.tenant_id,
    p_outbox_id,
    v_outbox.to_phone,
    v_outbox.template_name,
    v_outbox.message_type,
    'sent',
    p_external_message_id,
    v_outbox.consent_type,
    v_outbox.consent_verified,
    p_response_data,
    p_latency_ms
  );
END;
$$;

-- Function to mark message as error with backoff
CREATE OR REPLACE FUNCTION public.mark_whatsapp_error(
  p_outbox_id UUID,
  p_error_code TEXT,
  p_error_message TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outbox RECORD;
  v_config RECORD;
  v_backoff_seconds INTEGER;
BEGIN
  SELECT * INTO v_outbox FROM whatsapp_outbox WHERE id = p_outbox_id;
  SELECT * INTO v_config FROM tenant_whatsapp_config WHERE tenant_id = v_outbox.tenant_id;

  -- Exponential backoff: 60s, 120s, 240s, etc.
  v_backoff_seconds := COALESCE(v_config.retry_delay_seconds, 60) * POWER(2, v_outbox.retries);

  UPDATE whatsapp_outbox
  SET 
    status = 'error',
    retries = retries + 1,
    last_error = p_error_message,
    next_retry_at = now() + (v_backoff_seconds || ' seconds')::interval,
    updated_at = now()
  WHERE id = p_outbox_id;

  -- Log for audit
  INSERT INTO whatsapp_send_log (
    tenant_id,
    outbox_id,
    to_phone,
    template_name,
    message_type,
    status,
    consent_type,
    consent_verified,
    error_code,
    error_message
  ) VALUES (
    v_outbox.tenant_id,
    p_outbox_id,
    v_outbox.to_phone,
    v_outbox.template_name,
    v_outbox.message_type,
    'error',
    v_outbox.consent_type,
    v_outbox.consent_verified,
    p_error_code,
    p_error_message
  );
END;
$$;