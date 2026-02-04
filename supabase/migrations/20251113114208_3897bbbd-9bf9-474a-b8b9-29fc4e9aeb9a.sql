-- Criar tabela de conversas WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wa_conversation_id text UNIQUE,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  telefone text NOT NULL,
  nome_contato text,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado', 'bloqueado')),
  atribuido_a uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ultima_mensagem_em timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id text UNIQUE,
  direcao text NOT NULL CHECK (direcao IN ('enviada', 'recebida')),
  sender_type text CHECK (sender_type IN ('paciente', 'operador', 'sistema')),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  conteudo text NOT NULL,
  tipo_mensagem text DEFAULT 'text' CHECK (tipo_mensagem IN ('text', 'image', 'audio', 'video', 'document', 'button_reply')),
  midia_url text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'entregue', 'lido', 'falhou')),
  template_name text,
  template_params jsonb,
  erro_mensagem text,
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_paciente ON whatsapp_conversations(paciente_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_telefone ON whatsapp_conversations(telefone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direcao ON whatsapp_messages(direcao);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_conversation_updated_at();

-- Trigger para atualizar ultima_mensagem_em na conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET ultima_mensagem_em = NEW.timestamp
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_messages_update_conversation
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- RLS Policies
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Operadores podem ver conversas do seu tenant
CREATE POLICY "Operadores podem ver conversas do tenant"
  ON whatsapp_conversations FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Operadores podem criar conversas no seu tenant
CREATE POLICY "Operadores podem criar conversas"
  ON whatsapp_conversations FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Operadores podem atualizar conversas do seu tenant
CREATE POLICY "Operadores podem atualizar conversas"
  ON whatsapp_conversations FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Operadores podem ver mensagens das conversas do tenant
CREATE POLICY "Operadores podem ver mensagens"
  ON whatsapp_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM whatsapp_conversations
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Operadores podem criar mensagens
CREATE POLICY "Operadores podem criar mensagens"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM whatsapp_conversations
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Sistema pode atualizar status de mensagens
CREATE POLICY "Sistema pode atualizar mensagens"
  ON whatsapp_messages FOR UPDATE
  USING (true);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;