-- Step 2: Create support enums and tables
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
CREATE TYPE support_ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_to UUID REFERENCES public.system_users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority support_ticket_priority NOT NULL DEFAULT 'medium',
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.system_users(id)
);

-- Create support messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'support')),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Create support actions log table
CREATE TABLE IF NOT EXISTS public.support_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_user_id UUID NOT NULL REFERENCES public.system_users(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_actions_log_user ON public.support_actions_log(support_user_id);
CREATE INDEX IF NOT EXISTS idx_support_actions_log_created ON public.support_actions_log(created_at);
CREATE INDEX IF NOT EXISTS idx_support_actions_log_search ON public.support_actions_log USING gin(to_tsvector('portuguese', description));

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_actions_log ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_support_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.system_users
    WHERE id = _user_id
      AND system_role IN ('master', 'support', 'support_basic', 'support_intermediate')
      AND active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_support_level(_user_id UUID)
RETURNS system_role
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT system_role
  FROM public.system_users
  WHERE id = _user_id AND active = true
  LIMIT 1
$$;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Support can view all tickets" ON public.support_tickets
  FOR SELECT USING (has_support_access(auth.uid()));

CREATE POLICY "Support can update tickets" ON public.support_tickets
  FOR UPDATE USING (has_support_access(auth.uid()));

-- RLS Policies for support_messages
CREATE POLICY "Users can view their ticket messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = support_messages.ticket_id AND user_id = auth.uid()
    ) AND NOT is_internal
  );

CREATE POLICY "Users can send messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND sender_type = 'user' AND NOT is_internal
  );

CREATE POLICY "Support can view all messages" ON public.support_messages
  FOR SELECT USING (has_support_access(auth.uid()));

CREATE POLICY "Support can send messages" ON public.support_messages
  FOR INSERT WITH CHECK (has_support_access(auth.uid()) AND sender_type = 'support');

-- RLS Policies for support_actions_log
CREATE POLICY "Support can view logs" ON public.support_actions_log
  FOR SELECT USING (has_support_access(auth.uid()));

CREATE POLICY "Support can create logs" ON public.support_actions_log
  FOR INSERT WITH CHECK (support_user_id = auth.uid() AND has_support_access(auth.uid()));

-- Trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;