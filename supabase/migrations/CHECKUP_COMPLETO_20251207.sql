-- ============================================================================
-- CLINFLOW - CHECKUP COMPLETO E AJUSTES PENDENTES
-- Data: 2025-12-07
-- Descrição: Script consolidado para aplicar todas as migrations pendentes
-- ============================================================================

-- ============================================================================
-- 1. SISTEMA DE TICKETS DE SUPORTE
-- ============================================================================

-- Criar tabela de chamados
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('tecnico', 'financeiro', 'duvida', 'sugestao', 'bug')),
    prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado')),
    atribuido_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolvido_em TIMESTAMP,
    fechado_em TIMESTAMP
);

-- Criar tabela de mensagens do chamado
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de histórico de status
CREATE TABLE IF NOT EXISTS support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    comentario TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_categoria ON support_tickets(categoria);
CREATE INDEX IF NOT EXISTS idx_support_tickets_prioridade ON support_tickets(prioridade);
CREATE INDEX IF NOT EXISTS idx_support_tickets_atribuido ON support_tickets(atribuido_a);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_history_ticket ON support_ticket_history(ticket_id);

-- RLS para tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_history ENABLE ROW LEVEL SECURITY;

-- Políticas (DROP IF EXISTS para evitar duplicação)
DROP POLICY IF EXISTS support_tickets_tenant_isolation ON support_tickets;
CREATE POLICY support_tickets_tenant_isolation ON support_tickets
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('support', 'org_admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS support_ticket_messages_access ON support_ticket_messages;
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

DROP POLICY IF EXISTS support_ticket_history_access ON support_ticket_history;
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

-- Funções e triggers para tickets
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_updated_at();

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

DROP TRIGGER IF EXISTS support_tickets_status_change ON support_tickets;
CREATE TRIGGER support_tickets_status_change
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_support_ticket_status_change();

-- View de estatísticas
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

-- ============================================================================
-- 2. SISTEMA DE ALARMES E LEMBRETES
-- ============================================================================

-- Criar tabela de alarmes/lembretes
CREATE TABLE IF NOT EXISTS alarmes_lembretes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('alarme', 'lembrete', 'tarefa')),
    prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    data_hora TIMESTAMP NOT NULL,
    recorrencia TEXT CHECK (recorrencia IN ('unica', 'diaria', 'semanal', 'mensal')),
    dias_semana INTEGER[],
    ativo BOOLEAN DEFAULT true,
    concluido BOOLEAN DEFAULT false,
    concluido_em TIMESTAMP,
    concluido_por UUID REFERENCES profiles(id),
    notificacao_enviada BOOLEAN DEFAULT false,
    notificacao_enviada_em TIMESTAMP,
    canal_notificacao TEXT DEFAULT 'sistema' CHECK (canal_notificacao IN ('sistema', 'email', 'whatsapp', 'todos')),
    vinculo_tipo TEXT,
    vinculo_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de histórico de notificações
CREATE TABLE IF NOT EXISTS alarmes_notificacoes_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alarme_id UUID NOT NULL REFERENCES alarmes_lembretes(id) ON DELETE CASCADE,
    canal TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('enviado', 'erro', 'lido')),
    erro_mensagem TEXT,
    enviado_em TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de templates de lembretes
CREATE TABLE IF NOT EXISTS alarmes_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL,
    template_titulo TEXT NOT NULL,
    template_descricao TEXT NOT NULL,
    antecedencia_minutos INTEGER DEFAULT 60,
    canal_padrao TEXT DEFAULT 'sistema',
    ativo BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para alarmes
CREATE INDEX IF NOT EXISTS idx_alarmes_tenant ON alarmes_lembretes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alarmes_usuario ON alarmes_lembretes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_alarmes_data_hora ON alarmes_lembretes(data_hora) WHERE ativo = true AND concluido = false;
CREATE INDEX IF NOT EXISTS idx_alarmes_tipo ON alarmes_lembretes(tipo);
CREATE INDEX IF NOT EXISTS idx_alarmes_prioridade ON alarmes_lembretes(prioridade);
CREATE INDEX IF NOT EXISTS idx_alarmes_vinculo ON alarmes_lembretes(vinculo_tipo, vinculo_id);
CREATE INDEX IF NOT EXISTS idx_alarmes_notificacoes_alarme ON alarmes_notificacoes_historico(alarme_id);

-- RLS para alarmes
ALTER TABLE alarmes_lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarmes_notificacoes_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarmes_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para alarmes
DROP POLICY IF EXISTS alarmes_tenant_isolation ON alarmes_lembretes;
CREATE POLICY alarmes_tenant_isolation ON alarmes_lembretes
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR usuario_id = auth.uid()
    );

DROP POLICY IF EXISTS alarmes_notificacoes_access ON alarmes_notificacoes_historico;
CREATE POLICY alarmes_notificacoes_access ON alarmes_notificacoes_historico
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM alarmes_lembretes al
            WHERE al.id = alarmes_notificacoes_historico.alarme_id
            AND (
                al.tenant_id = current_setting('app.current_tenant_id', true)::uuid
                OR al.usuario_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS alarmes_templates_access ON alarmes_templates;
CREATE POLICY alarmes_templates_access ON alarmes_templates
    FOR ALL USING (
        is_global = true
        OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );

-- Funções para alarmes
CREATE OR REPLACE FUNCTION update_alarme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS alarmes_updated_at ON alarmes_lembretes;
CREATE TRIGGER alarmes_updated_at
    BEFORE UPDATE ON alarmes_lembretes
    FOR EACH ROW
    EXECUTE FUNCTION update_alarme_updated_at();

CREATE OR REPLACE FUNCTION marcar_alarme_concluido(
    p_alarme_id UUID,
    p_usuario_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE alarmes_lembretes
    SET 
        concluido = true,
        concluido_em = NOW(),
        concluido_por = p_usuario_id
    WHERE id = p_alarme_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION buscar_alarmes_pendentes(
    p_tenant_id UUID,
    p_usuario_id UUID DEFAULT NULL,
    p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    titulo TEXT,
    descricao TEXT,
    tipo TEXT,
    prioridade TEXT,
    data_hora TIMESTAMP,
    vinculo_tipo TEXT,
    vinculo_id UUID,
    atrasado BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.titulo,
        al.descricao,
        al.tipo,
        al.prioridade,
        al.data_hora,
        al.vinculo_tipo,
        al.vinculo_id,
        (al.data_hora < NOW()) as atrasado
    FROM alarmes_lembretes al
    WHERE al.tenant_id = p_tenant_id
        AND al.ativo = true
        AND al.concluido = false
        AND (p_usuario_id IS NULL OR al.usuario_id = p_usuario_id)
    ORDER BY 
        al.prioridade DESC,
        al.data_hora ASC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- Inserir templates globais padrão (apenas se não existirem)
INSERT INTO alarmes_templates (nome, descricao, tipo, template_titulo, template_descricao, antecedencia_minutos, is_global)
SELECT * FROM (VALUES
    ('Lembrete de Consulta D-1', 'Lembrete 1 dia antes da consulta', 'lembrete', 'Consulta Amanhã', 'Lembrar de confirmar presença do paciente', 1440, true),
    ('Lembrete de Consulta H-3', 'Lembrete 3 horas antes', 'lembrete', 'Consulta em 3 horas', 'Paciente tem consulta daqui a 3 horas', 180, true),
    ('Alarme Pagamento Vencendo', 'Alerta de pagamento próximo', 'alarme', 'Pagamento Vencendo', 'Verificar pagamento pendente', 1440, true),
    ('Tarefa Follow-up', 'Tarefa de acompanhamento pós-consulta', 'tarefa', 'Follow-up Paciente', 'Entrar em contato para acompanhamento', 0, true),
    ('Lembrete Renovação Receita', 'Lembrete para renovar receita', 'lembrete', 'Renovar Receita', 'Paciente precisa renovar receita médica', 10080, true)
) AS t(nome, descricao, tipo, template_titulo, template_descricao, antecedencia_minutos, is_global)
WHERE NOT EXISTS (
    SELECT 1 FROM alarmes_templates WHERE is_global = true
);

-- View para dashboard de alarmes
CREATE OR REPLACE VIEW view_alarmes_dashboard AS
SELECT 
    t.id as tenant_id,
    t.nome as tenant_nome,
    COUNT(DISTINCT al.id) FILTER (WHERE al.concluido = false AND al.ativo = true) as total_pendentes,
    COUNT(DISTINCT al.id) FILTER (WHERE al.concluido = false AND al.ativo = true AND al.data_hora < NOW()) as total_atrasados,
    COUNT(DISTINCT al.id) FILTER (WHERE al.concluido = false AND al.ativo = true AND al.prioridade = 'urgente') as total_urgentes,
    COUNT(DISTINCT al.id) FILTER (WHERE al.concluido = true) as total_concluidos,
    COUNT(DISTINCT al.id) FILTER (WHERE al.tipo = 'alarme') as total_alarmes,
    COUNT(DISTINCT al.id) FILTER (WHERE al.tipo = 'lembrete') as total_lembretes,
    COUNT(DISTINCT al.id) FILTER (WHERE al.tipo = 'tarefa') as total_tarefas
FROM tenants t
LEFT JOIN alarmes_lembretes al ON al.tenant_id = t.id AND al.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.id, t.nome;

GRANT SELECT ON view_alarmes_dashboard TO authenticated;

-- ============================================================================
-- 3. PREFERÊNCIA DE TEMA PARA USUÁRIOS DE SUPORTE
-- ============================================================================

-- Adicionar coluna theme_preference à tabela system_users
ALTER TABLE system_users 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark'));

-- Comentário na coluna
COMMENT ON COLUMN system_users.theme_preference IS 'Preferência de tema do usuário de suporte (light ou dark)';

-- ============================================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE support_tickets IS 'Chamados técnicos de suporte';
COMMENT ON TABLE support_ticket_messages IS 'Mensagens trocadas em chamados';
COMMENT ON TABLE support_ticket_history IS 'Histórico de mudanças de status';
COMMENT ON TABLE alarmes_lembretes IS 'Sistema de alarmes, lembretes e tarefas';
COMMENT ON TABLE alarmes_notificacoes_historico IS 'Histórico de notificações enviadas';
COMMENT ON TABLE alarmes_templates IS 'Templates pré-configurados de alarmes';

-- ============================================================================
-- 5. VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
DO $$
BEGIN
    RAISE NOTICE '✓ Verificando tabelas criadas...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        RAISE NOTICE '  ✓ support_tickets criada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alarmes_lembretes') THEN
        RAISE NOTICE '  ✓ alarmes_lembretes criada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_users' AND column_name = 'theme_preference') THEN
        RAISE NOTICE '  ✓ theme_preference adicionada';
    END IF;
    
    RAISE NOTICE '✓ Checkup completo finalizado!';
END $$;
