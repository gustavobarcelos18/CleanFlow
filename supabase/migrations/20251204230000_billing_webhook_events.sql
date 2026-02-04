-- Migration: Create Billing Webhook Events table and RPCs
-- Description: Stores processed webhook events for idempotency and auditing.

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT false,
    processing_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

-- RPC to check if event exists
CREATE OR REPLACE FUNCTION public.check_billing_event_processed(p_event_id TEXT, p_provider TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.billing_webhook_events 
        WHERE event_id = p_event_id AND provider = p_provider AND processed = true
    );
END;
$$;

-- RPC to register event
CREATE OR REPLACE FUNCTION public.register_billing_event(
    p_event_id TEXT,
    p_provider TEXT,
    p_event_type TEXT,
    p_payload JSONB,
    p_processed BOOLEAN,
    p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.billing_webhook_events (event_id, provider, event_type, payload, processed, processing_details)
    VALUES (p_event_id, p_provider, p_event_type, p_payload, p_processed, p_details)
    ON CONFLICT (event_id) DO UPDATE
    SET processed = p_processed, processing_details = p_details, created_at = now()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;
