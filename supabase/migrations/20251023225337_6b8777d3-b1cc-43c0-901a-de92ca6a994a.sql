-- ============================================
-- TRIGGERS PARA COLETA AUTOMÁTICA DE MÉTRICAS
-- ============================================

-- Função para atualizar métricas diárias
CREATE OR REPLACE FUNCTION public.atualizar_metricas_diarias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hoje date := CURRENT_DATE;
  v_tenant record;
BEGIN
  -- Para cada tenant, calcular métricas do dia
  FOR v_tenant IN SELECT DISTINCT tenant_id FROM support_tickets
  LOOP
    INSERT INTO public.support_metrics (
      data,
      tenant_id,
      tickets_abertos,
      tickets_fechados,
      tempo_medio_primeira_resposta_minutos,
      slas_estourados,
      chats_iniciados,
      chats_finalizados,
      tempo_medio_resolucao_horas
    )
    SELECT
      v_hoje,
      v_tenant.tenant_id,
      COUNT(*) FILTER (WHERE created_at::date = v_hoje AND status = 'open'),
      COUNT(*) FILTER (WHERE resolved_at::date = v_hoje),
      COALESCE(AVG(EXTRACT(EPOCH FROM (
        (SELECT MIN(created_at) FROM support_messages sm WHERE sm.ticket_id = support_tickets.id AND sm.sender_type = 'support')
        - created_at
      )) / 60) FILTER (WHERE created_at::date = v_hoje), 0)::integer,
      COUNT(*) FILTER (WHERE created_at::date = v_hoje AND (sla->>'atingido')::boolean = true),
      (SELECT COUNT(*) FROM support_chat_sessions WHERE started_at::date = v_hoje AND tenant_id = v_tenant.tenant_id),
      (SELECT COUNT(*) FROM support_chat_sessions WHERE ended_at::date = v_hoje AND tenant_id = v_tenant.tenant_id),
      COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at::date = v_hoje), 0)
    FROM support_tickets
    WHERE tenant_id = v_tenant.tenant_id
    ON CONFLICT (data, tenant_id) DO UPDATE SET
      tickets_abertos = EXCLUDED.tickets_abertos,
      tickets_fechados = EXCLUDED.tickets_fechados,
      tempo_medio_primeira_resposta_minutos = EXCLUDED.tempo_medio_primeira_resposta_minutos,
      slas_estourados = EXCLUDED.slas_estourados,
      chats_iniciados = EXCLUDED.chats_iniciados,
      chats_finalizados = EXCLUDED.chats_finalizados,
      tempo_medio_resolucao_horas = EXCLUDED.tempo_medio_resolucao_horas,
      updated_at = now();
  END LOOP;
  
  -- Métricas globais (sem tenant específico)
  INSERT INTO public.support_metrics (
    data,
    tickets_abertos,
    tickets_fechados,
    tempo_medio_primeira_resposta_minutos,
    slas_estourados,
    chats_iniciados,
    chats_finalizados,
    tempo_medio_resolucao_horas
  )
  SELECT
    v_hoje,
    COUNT(*) FILTER (WHERE created_at::date = v_hoje AND status = 'open'),
    COUNT(*) FILTER (WHERE resolved_at::date = v_hoje),
    COALESCE(AVG(EXTRACT(EPOCH FROM (
      (SELECT MIN(created_at) FROM support_messages sm WHERE sm.ticket_id = support_tickets.id AND sm.sender_type = 'support')
      - created_at
    )) / 60) FILTER (WHERE created_at::date = v_hoje), 0)::integer,
    COUNT(*) FILTER (WHERE created_at::date = v_hoje AND (sla->>'atingido')::boolean = true),
    (SELECT COUNT(*) FROM support_chat_sessions WHERE started_at::date = v_hoje),
    (SELECT COUNT(*) FROM support_chat_sessions WHERE ended_at::date = v_hoje),
    COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at::date = v_hoje), 0)
  FROM support_tickets
  ON CONFLICT (data) WHERE tenant_id IS NULL DO UPDATE SET
    tickets_abertos = EXCLUDED.tickets_abertos,
    tickets_fechados = EXCLUDED.tickets_fechados,
    tempo_medio_primeira_resposta_minutos = EXCLUDED.tempo_medio_primeira_resposta_minutos,
    slas_estourados = EXCLUDED.slas_estourados,
    chats_iniciados = EXCLUDED.chats_iniciados,
    chats_finalizados = EXCLUDED.chats_finalizados,
    tempo_medio_resolucao_horas = EXCLUDED.tempo_medio_resolucao_horas,
    updated_at = now();
END;
$$;

-- ============================================
-- SISTEMA DE LOGS ESTRUTURADOS
-- ============================================

-- Função para registrar logs de sistema
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_level text,
  p_message text,
  p_service text DEFAULT 'application',
  p_request_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.system_logs (
    level,
    message,
    service,
    request_id,
    user_id,
    tenant_id,
    metadata
  ) VALUES (
    p_level,
    p_message,
    p_service,
    COALESCE(p_request_id, gen_random_uuid()),
    p_user_id,
    p_tenant_id,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Trigger para registrar erros HTTP
CREATE OR REPLACE FUNCTION public.log_http_error()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log automático quando erro é registrado
  PERFORM log_system_event(
    'error',
    NEW.error_message,
    NEW.endpoint,
    NEW.request_id,
    NEW.user_id,
    NEW.tenant_id,
    jsonb_build_object(
      'status_code', NEW.status_code,
      'method', NEW.method,
      'stack_trace', NEW.stack_trace
    )
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_http_error
AFTER INSERT ON public.error_metrics
FOR EACH ROW
EXECUTE FUNCTION log_http_error();

-- ============================================
-- AUDITORIA DE EXPORTAÇÕES
-- ============================================

-- Função para registrar exportação
CREATE OR REPLACE FUNCTION public.registrar_exportacao(
  p_user_id uuid,
  p_export_type text,
  p_table_name text,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_record_count integer DEFAULT NULL,
  p_file_format text DEFAULT 'csv'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_export_id uuid;
BEGIN
  INSERT INTO public.export_audit (
    user_id,
    export_type,
    table_name,
    filters,
    record_count,
    file_format,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_export_type,
    p_table_name,
    p_filters,
    p_record_count,
    p_file_format,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  ) RETURNING id INTO v_export_id;
  
  -- Log na auditoria admin
  INSERT INTO public.auditoria_admin (
    usuario_id,
    tipo_evento,
    descricao,
    metadata
  ) VALUES (
    p_user_id,
    'data_export',
    'Exportação de dados: ' || p_export_type,
    jsonb_build_object(
      'export_id', v_export_id,
      'table_name', p_table_name,
      'record_count', p_record_count
    )
  );
  
  RETURN v_export_id;
END;
$$;

-- ============================================
-- LIMPEZA DE DADOS POR RETENÇÃO
-- ============================================

-- Função para aplicar políticas de retenção
CREATE OR REPLACE FUNCTION public.aplicar_politicas_retencao()
RETURNS TABLE(table_name text, records_deleted integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy record;
  v_deleted integer;
  v_cutoff_date date;
BEGIN
  FOR v_policy IN 
    SELECT * FROM public.data_retention_policies WHERE active = true
  LOOP
    v_cutoff_date := CURRENT_DATE - (v_policy.retention_months || ' months')::interval;
    
    -- Executar cleanup baseado na tabela
    CASE v_policy.table_name
      WHEN 'support_tickets' THEN
        DELETE FROM public.support_tickets 
        WHERE created_at::date < v_cutoff_date 
          AND status IN ('resolved', 'closed');
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        
      WHEN 'support_chat_sessions' THEN
        DELETE FROM public.support_chat_sessions 
        WHERE started_at::date < v_cutoff_date 
          AND status = 'closed';
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        
      WHEN 'auditoria_admin' THEN
        DELETE FROM public.auditoria_admin 
        WHERE created_at::date < v_cutoff_date;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        
      WHEN 'system_logs' THEN
        DELETE FROM public.system_logs 
        WHERE created_at::date < v_cutoff_date 
          AND level NOT IN ('error', 'critical');
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        
      ELSE
        v_deleted := 0;
    END CASE;
    
    -- Atualizar última limpeza
    UPDATE public.data_retention_policies
    SET last_cleanup_at = now()
    WHERE id = v_policy.id;
    
    table_name := v_policy.table_name;
    records_deleted := v_deleted;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================
-- 2FA - FUNÇÕES DE SUPORTE
-- ============================================

-- Tabela para códigos 2FA temporários
CREATE TABLE IF NOT EXISTS public.two_factor_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2FA codes"
ON public.two_factor_codes FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert 2FA codes"
ON public.two_factor_codes FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update 2FA codes"
ON public.two_factor_codes FOR UPDATE
USING (true);

-- Função para gerar código 2FA
CREATE OR REPLACE FUNCTION public.generate_2fa_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  -- Gerar código de 6 dígitos
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  
  -- Limpar códigos antigos do usuário
  DELETE FROM public.two_factor_codes
  WHERE user_id = p_user_id AND (used = true OR expires_at < now());
  
  -- Inserir novo código
  INSERT INTO public.two_factor_codes (user_id, code, expires_at)
  VALUES (p_user_id, v_code, now() + interval '10 minutes');
  
  RETURN v_code;
END;
$$;

-- Função para validar código 2FA
CREATE OR REPLACE FUNCTION public.validate_2fa_code(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean;
BEGIN
  -- Verificar se código existe e é válido
  SELECT EXISTS(
    SELECT 1 FROM public.two_factor_codes
    WHERE user_id = p_user_id
      AND code = p_code
      AND expires_at > now()
      AND used = false
  ) INTO v_valid;
  
  -- Se válido, marcar como usado
  IF v_valid THEN
    UPDATE public.two_factor_codes
    SET used = true
    WHERE user_id = p_user_id AND code = p_code;
  END IF;
  
  RETURN v_valid;
END;
$$;

-- Criar índice único para data + tenant_id NULL em support_metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_metrics_data_null_tenant 
ON public.support_metrics(data) 
WHERE tenant_id IS NULL;