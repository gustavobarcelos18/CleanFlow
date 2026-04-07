-- Migração: 20240406_whatsapp_worker_v1 (v1.3 - Escopo Travado)
-- Descrição: Tabela, RPCs de Concorrência e Billing atômico p/ WhatsApp Baileys

-- 1. Enums do Postgres para Status (Garantir escalabilidade)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_instance_status') THEN
        CREATE TYPE public.whatsapp_instance_status AS ENUM ('DISCONNECTED', 'CONNECTING', 'QR_READY', 'CONNECTED', 'QUARANTINE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_queue_status') THEN
        CREATE TYPE public.whatsapp_queue_status AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');
    END IF;
END$$;

-- 2. Tabela de Instâncias (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status public.whatsapp_instance_status NOT NULL DEFAULT 'DISCONNECTED',
    qr_code TEXT,
    session_data JSONB, -- Payload Base64 { ciphertext, iv, tag, version, alg: 'aes-256-gcm' } (Cifrado no Driver Node)
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can access their own instances" ON public.whatsapp_instances
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.rbac_usuarios WHERE tenant_id = whatsapp_instances.tenant_id));


-- 3. Tabela de Templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    trigger_event TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL, -- Suporte a {{variaveis}}
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, trigger_event)
);


-- 4. Tabela de Fila de Mensagens (Worker Queue)
CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.whatsapp_instances(id),
    
    -- Dados da Mensagem
    phone_number TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text', -- text, template, media
    template_id UUID REFERENCES public.whatsapp_templates(id),
    media_url TEXT,
    caption TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb, -- Payload extra para extensibilidade/variáveis
    
    -- Controle de Fila e Estados
    status public.whatsapp_queue_status NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error_at TIMESTAMP WITH TIME ZONE,
    error_log TEXT,
    
    -- Concorrência e Lock
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID, -- ID do Worker instance/pod preenchendo o request
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Idempotência e Agendamento
    appointment_id UUID, 
    trigger_type TEXT, 
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at_date DATE GENERATED ALWAYS AS (DATE(scheduled_at)) STORED,
    
    sent_at TIMESTAMP WITH TIME ZONE,
    billing_status TEXT DEFAULT 'PENDING', -- PENDING, DEBITED, FAILED, EXEMPT
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice Único de Idempotência
CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_queue_idempotency 
ON public.whatsapp_queue (tenant_id, appointment_id, trigger_type, scheduled_at_date) 
WHERE appointment_id IS NOT NULL AND trigger_type IS NOT NULL;

-- Indíces de Performance
CREATE INDEX IF NOT EXISTS idx_wa_instances_tenant ON public.whatsapp_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wa_queue_process_lookup ON public.whatsapp_queue(status, scheduled_at) 
WHERE status IN ('PENDING', 'PROCESSING', 'FAILED');

ALTER TABLE public.whatsapp_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own queue" ON public.whatsapp_queue
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.rbac_usuarios WHERE tenant_id = whatsapp_queue.tenant_id));


-- Trigger Automático Updated_At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_wa_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_wa_queue_updated_at BEFORE UPDATE ON public.whatsapp_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_update_wa_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 5. Atualização da Ledger Existente (tenant_credit_transactions) para Idempotência
ALTER TABLE public.tenant_credit_transactions 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_credit_idempotency 
ON public.tenant_credit_transactions (tenant_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 6. RPC (Stored Procedure) para CLAIM JOBS (SELECT FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.claim_whatsapp_jobs(
    p_worker_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS SETOF public.whatsapp_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_locked_ids UUID[];
BEGIN
    -- Reclaim de órfãos (Lock expirado volta pra retry)
    UPDATE public.whatsapp_queue
    SET 
        status = 'FAILED',
        error_log = 'Worker timeout. Lock expirado.',
        retry_count = LEAST(retry_count + 1, max_retries),
        locked_at = NULL,
        locked_by = NULL,
        lock_expires_at = NULL
    WHERE status = 'PROCESSING' AND lock_expires_at < NOW();

    -- Seleciona e tranca as linhas aplicáveis
    WITH locked_rows AS (
        SELECT id
        FROM public.whatsapp_queue
        WHERE 
            scheduled_at <= NOW() AND
            (status = 'PENDING' OR (status = 'FAILED' AND retry_count < max_retries)) AND
            (locked_at IS NULL OR lock_expires_at < NOW())
        ORDER BY scheduled_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.whatsapp_queue 
    SET 
        status = 'PROCESSING',
        locked_at = NOW(),
        locked_by = p_worker_id,
        lock_expires_at = NOW() + INTERVAL '5 minutes',
        updated_at = NOW()
    FROM locked_rows
    WHERE public.whatsapp_queue.id = locked_rows.id
    RETURNING public.whatsapp_queue.id INTO v_locked_ids;

    -- Retorna os dados das linhas afetadas
    RETURN QUERY 
    SELECT * FROM public.whatsapp_queue 
    WHERE id = ANY(v_locked_ids);
END;
$$;

-- 7. RPC para Update Fim-de-Processo + Transação Atômica do Billing Ledger
CREATE OR REPLACE FUNCTION public.mark_message_sent_and_debit(
    p_queue_id UUID,
    p_tenant_id UUID,
    p_price_unit NUMERIC,
    p_idempotency_key TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Transação Atômica Ledger (Proteção com Idempotência)
    -- Se duplicar, a RPC aborta com Throw da Constraint Exception do UNIQUE INDEX
    INSERT INTO public.tenant_credit_transactions (
        id, tenant_id, tipo, quantidade, preco_unitario, valor_total, saldo_anterior, saldo_novo, motivo, idempotency_key, metadata, created_at
    ) 
    VALUES (
        gen_random_uuid(),
        p_tenant_id,
        'USO', 
        1, 
        p_price_unit, 
        p_price_unit, 
        0, 
        0,
        'Envio de WhatsApp Transacional',
        p_idempotency_key,
        jsonb_build_object('whatsapp_queue_id', p_queue_id),
        NOW()
    );

    -- Atualiza fila
    UPDATE public.whatsapp_queue
    SET 
        status = 'SENT',
        sent_at = NOW(),
        billing_status = 'DEBITED',
        locked_at = NULL,
        locked_by = NULL,
        lock_expires_at = NULL,
        updated_at = NOW()
    WHERE id = p_queue_id AND status = 'PROCESSING';

    IF NOT FOUND THEN
        -- Reverter manual não é necessário; rollback ocorre nativamente com Exception se a UPDATE n rolar
        RETURN FALSE; 
    END IF;

    RETURN TRUE;
END;
$$;
