-- Migration para sistema de chamados técnicos (suporte)
-- 20251207191000_support_tickets_system.sql

-- 1. Criar tabela de chamados
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL, -- 'tecnico', 'financeiro', 'duvida', 'sugestao', 'bug'
    prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
    status TEXT DEFAULT 'aberto', -- 'aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'
    atribuido_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolvido_em TIMESTAMP,
    fechado_em TIMESTAMP
);

-- 2. Criar tabela de mensagens do chamado
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Mensagem interna (apenas equipe)
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar tabela de histórico de status
CREATE TABLE IF NOT EXISTS support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    comentario TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_categoria ON support_tickets(categoria);
CREATE INDEX idx_support_tickets_prioridade ON support_tickets(prioridade);
CREATE INDEX idx_support_tickets_atribuido ON support_tickets(atribuido_a);
CREATE INDEX idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX idx_support_ticket_history_ticket ON support_ticket_history(ticket_id);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_history ENABLE ROW LEVEL SECURITY;

-- Políticas para tickets
CREATE POLICY support_tickets_tenant_isolation ON support_tickets
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('support', 'org_admin', 'super_admin')
        )
    );

-- Políticas para mensagens
CREATE POLICY support_ticket_messages_access ON support_ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = support_ticket_messages.ticket_id
            AND (
                st.tenant_id = current_setting('app.current_tenant_id', true)::uuid
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role IN ('support', 'org_admin', 'super_admin')
                )
            )
        )
    );

-- Políticas para histórico
CREATE POLICY support_ticket_history_access ON support_ticket_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = support_ticket_history.ticket_id
            AND (
                st.tenant_id = current_setting('app.current_tenant_id', true)::uuid
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role IN ('support', 'org_admin', 'super_admin')
                )
            )
        )
    );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_updated_at();

-- Função para registrar mudança de status
CREATE OR REPLACE FUNCTION log_support_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO support_ticket_history (
            ticket_id,
            usuario_id,
            status_anterior,
            status_novo
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status,
            NEW.status
        );
        
        -- Atualizar timestamps
        IF NEW.status = 'resolvido' AND OLD.status != 'resolvido' THEN
            NEW.resolvido_em = NOW();
        END IF;
        
        IF NEW.status = 'fechado' AND OLD.status != 'fechado' THEN
            NEW.fechado_em = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_status_change
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_support_ticket_status_change();

-- View para estatísticas de suporte
CREATE OR REPLACE VIEW view_support_stats AS
SELECT 
    t.id as tenant_id,
    t.nome as tenant_nome,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'aberto') as tickets_abertos,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'em_andamento') as tickets_em_andamento,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'aguardando_cliente') as tickets_aguardando,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'resolvido') as tickets_resolvidos,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'fechado') as tickets_fechados,
    COUNT(DISTINCT st.id) FILTER (WHERE st.prioridade = 'urgente' AND st.status NOT IN ('resolvido', 'fechado')) as tickets_urgentes,
    AVG(EXTRACT(EPOCH FROM (st.resolvido_em - st.created_at)) / 3600) FILTER (WHERE st.resolvido_em IS NOT NULL) as tempo_medio_resolucao_horas
FROM tenants t
LEFT JOIN support_tickets st ON st.tenant_id = t.id AND st.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.id, t.nome;

GRANT SELECT ON view_support_stats TO authenticated;

-- Comentários
COMMENT ON TABLE support_tickets IS 'Chamados técnicos de suporte';
COMMENT ON TABLE support_ticket_messages IS 'Mensagens trocadas em chamados';
COMMENT ON TABLE support_ticket_history IS 'Histórico de mudanças de status';
COMMENT ON COLUMN support_tickets.categoria IS 'Categoria: tecnico, financeiro, duvida, sugestao, bug';
COMMENT ON COLUMN support_tickets.prioridade IS 'Prioridade: baixa, media, alta, urgente';
COMMENT ON COLUMN support_tickets.status IS 'Status: aberto, em_andamento, aguardando_cliente, resolvido, fechado';
