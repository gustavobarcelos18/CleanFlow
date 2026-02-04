-- Create whatsapp_outbox table
CREATE TABLE IF NOT EXISTS public.whatsapp_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    message_type TEXT NOT NULL DEFAULT 'operacional',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_status ON public.whatsapp_outbox(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_tenant ON public.whatsapp_outbox(tenant_id);

-- Add trigger to update updated_at if needed (skipping for simplicity as it's a log/queue table)

-- Grant permissions
GRANT ALL ON public.whatsapp_outbox TO authenticated;
GRANT ALL ON public.whatsapp_outbox TO service_role;
