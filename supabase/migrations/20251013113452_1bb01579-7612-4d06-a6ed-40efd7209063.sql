-- Tabela de sessões de chat de suporte
CREATE TABLE IF NOT EXISTS public.support_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'resolved', 'closed')),
  assigned_agent_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  wait_time_seconds INTEGER,
  inactivity_warning_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de mensagens de chat
CREATE TABLE IF NOT EXISTS public.support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.support_chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'agent', 'system')),
  sender_id UUID REFERENCES auth.users(id),
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de preferências dos agentes
CREATE TABLE IF NOT EXISTS public.support_agent_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  sound_enabled BOOLEAN DEFAULT true,
  sound_volume INTEGER DEFAULT 80 CHECK (sound_volume >= 0 AND sound_volume <= 100),
  max_concurrent_chats INTEGER DEFAULT 3 CHECK (max_concurrent_chats > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant ON public.support_chat_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent ON public.support_chat_sessions(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.support_chat_messages(session_id);

-- Habilitar RLS
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agent_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sessões de chat
CREATE POLICY "Support can view all chat sessions"
  ON public.support_chat_sessions
  FOR SELECT
  TO authenticated
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can update chat sessions"
  ON public.support_chat_sessions
  FOR UPDATE
  TO authenticated
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can insert chat sessions"
  ON public.support_chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (has_support_access(auth.uid()));

-- Políticas RLS para mensagens de chat
CREATE POLICY "Support can view chat messages"
  ON public.support_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_chat_sessions
      WHERE id = session_id
      AND (has_support_access(auth.uid()) OR assigned_agent_id = auth.uid())
    )
  );

CREATE POLICY "Support can insert chat messages"
  ON public.support_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_chat_sessions
      WHERE id = session_id
      AND (has_support_access(auth.uid()) OR assigned_agent_id = auth.uid())
    )
  );

-- Políticas RLS para preferências
CREATE POLICY "Agents can manage own preferences"
  ON public.support_agent_preferences
  FOR ALL
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_chat_session_timestamp
  BEFORE UPDATE ON public.support_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_updated_at();

CREATE TRIGGER update_agent_preferences_timestamp
  BEFORE UPDATE ON public.support_agent_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_updated_at();

-- Função para calcular tempo de espera ao aceitar chat
CREATE OR REPLACE FUNCTION calculate_wait_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'waiting' AND NEW.accepted_at IS NOT NULL THEN
    NEW.wait_time_seconds = EXTRACT(EPOCH FROM (NEW.accepted_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_chat_wait_time
  BEFORE UPDATE ON public.support_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_wait_time();

-- Habilitar realtime para as tabelas de chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat_messages;