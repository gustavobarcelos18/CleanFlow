
-- Tabela para idempotência de eventos Stripe
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índice para busca rápida por event_id
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON public.stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at ON public.stripe_events(created_at);

-- RLS para stripe_events (apenas suporte pode ver)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_events_support_select"
ON public.stripe_events FOR SELECT
TO authenticated
USING (has_support_access(auth.uid()));

CREATE POLICY "stripe_events_system_insert"
ON public.stripe_events FOR INSERT
WITH CHECK (true);

-- Função para verificar idempotência
CREATE OR REPLACE FUNCTION public.check_stripe_event_processed(p_event_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stripe_events
    WHERE event_id = p_event_id
  )
$$;

-- Função para registrar evento processado
CREATE OR REPLACE FUNCTION public.register_stripe_event(
  p_event_id text,
  p_event_type text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload)
  ON CONFLICT (event_id) DO NOTHING
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
