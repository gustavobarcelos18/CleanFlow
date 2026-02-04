-- ============================================================================
-- CLINFLOW - CHECKUP COMPLETO FINAL V3 (CORREÇÃO DE ENUMS)
-- Data: 2025-12-07
-- Descrição: Script revisado para lidar corretamente com tipos ENUM existentes
-- ============================================================================

-- ============================================================================
-- 1. SISTEMA DE TICKETS DE SUPORTE
-- ============================================================================

-- 1.1. Garantir tabela base
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 1.2. Tratamento de ENUMs e Colunas

DO $$
BEGIN
    -- Verificar e tratar STATUS
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_status') THEN
        -- Se o enum já existe, vamos garantir que tenha os valores necessários
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'aberto';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'em_andamento';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'aguardando_cliente';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'resolvido';
        ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'fechado';
        
        -- Adicionar coluna usando o enum se não existir
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS status support_ticket_status DEFAULT 'aberto'::support_ticket_status;
    ELSE
        -- Se não existe enum, criar como TEXT com CHECK (mais flexível)
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aberto';
        
        -- Só adicionar constraint se for TEXT
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'status') = 'text' THEN
            ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
            ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check 
                CHECK (status IN ('aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'));
        END IF;
    END IF;

    -- Verificar e tratar PRIORIDADE
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_priority') THEN
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'baixa';
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'media';
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'alta';
        ALTER TYPE support_ticket_priority ADD VALUE IF NOT EXISTS 'urgente';
        
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS prioridade support_ticket_priority DEFAULT 'media'::support_ticket_priority;
    ELSE
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media';
        
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'prioridade') = 'text' THEN
            ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_prioridade_check;
            ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_prioridade_check 
                CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));
        END IF;
    END IF;

    -- Verificar e tratar CATEGORIA
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_category') THEN
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'tecnico';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'financeiro';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'duvida';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'sugestao';
        ALTER TYPE support_ticket_category ADD VALUE IF NOT EXISTS 'bug';
        
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS categoria support_ticket_category DEFAULT 'tecnico'::support_ticket_category;
    ELSE
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'tecnico';
        
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'categoria') = 'text' THEN
            ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_categoria_check;
            ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_categoria_check 
                CHECK (categoria IN ('tecnico', 'financeiro', 'duvida', 'sugestao', 'bug'));
        END IF;
    END IF;
END $$;

-- Outras colunas simples
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS atribuido_a UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS fechado_em TIMESTAMP;

-- 1.3. Tabelas auxiliares
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    anexos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    comentario TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 1.4. Índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_categoria ON support_tickets(categoria);
CREATE INDEX IF NOT EXISTS idx_support_tickets_prioridade ON support_tickets(prioridade);
CREATE INDEX IF NOT EXISTS idx_support_tickets_atribuido ON support_tickets(atribuido_a);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_history_ticket ON support_ticket_history(ticket_id);

-- 1.5. RLS e Políticas
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_tenant_isolation ON support_tickets;
CREATE POLICY support_tickets_tenant_isolation ON support_tickets
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR EXISTS (
            SELECT 1 FROM system_users
            WHERE system_users.id = auth.uid()
            AND system_users.active = true
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
                    SELECT 1 FROM system_users
                    WHERE system_users.id = auth.uid()
                    AND system_users.active = true
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
                    SELECT 1 FROM system_users
                    WHERE system_users.id = auth.uid()
                    AND system_users.active = true
                )
            )
        )
    );

-- 1.6. Triggers e Funções
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
    -- Cast para text para garantir comparação segura
    IF OLD.status::text IS DISTINCT FROM NEW.status::text THEN
        INSERT INTO support_ticket_history (
            ticket_id,
            usuario_id,
            status_anterior,
            status_novo
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status::text,
            NEW.status::text
        );
        
        IF NEW.status::text = 'resolvido' AND OLD.status::text != 'resolvido' THEN
            NEW.resolvido_em = NOW();
        END IF;
        
        IF NEW.status::text = 'fechado' AND OLD.status::text != 'fechado' THEN
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

-- 1.7. View (com CAST para evitar erro de tipo)
DROP VIEW IF EXISTS view_support_stats;
CREATE OR REPLACE VIEW view_support_stats AS
SELECT 
    t.id as tenant_id,
    t.nome as tenant_nome,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status::text = 'aberto') as tickets_abertos,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status::text = 'em_andamento') as tickets_em_andamento,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status::text = 'aguardando_cliente') as tickets_aguardando,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status::text = 'resolvido') as tickets_resolvidos,
    COUNT(DISTINCT st.id) FILTER (WHERE st.status::text = 'fechado') as tickets_fechados,
    COUNT(DISTINCT st.id) FILTER (WHERE st.prioridade::text = 'urgente' AND st.status::text NOT IN ('resolvido', 'fechado')) as tickets_urgentes,
    AVG(EXTRACT(EPOCH FROM (st.resolvido_em - st.created_at)) / 3600) FILTER (WHERE st.resolvido_em IS NOT NULL) as tempo_medio_resolucao_horas
FROM tenants t
LEFT JOIN support_tickets st ON st.tenant_id = t.id AND st.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.id, t.nome;

GRANT SELECT ON view_support_stats TO authenticated;

-- ============================================================================
-- 2. SISTEMA DE ALARMES E LEMBRETES
-- ============================================================================

-- 2.1. Tabela Principal
CREATE TABLE IF NOT EXISTS alarmes_lembretes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL,
    prioridade TEXT DEFAULT 'media',
    data_hora TIMESTAMP NOT NULL,
    recorrencia TEXT,
    dias_semana INTEGER[],
    ativo BOOLEAN DEFAULT true,
    concluido BOOLEAN DEFAULT false,
    concluido_em TIMESTAMP,
    concluido_por UUID REFERENCES profiles(id),
    notificacao_enviada BOOLEAN DEFAULT false,
    notificacao_enviada_em TIMESTAMP,
    canal_notificacao TEXT DEFAULT 'sistema',
    vinculo_tipo TEXT,
    vinculo_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Constraints Alarmes (Recriar para garantir)
ALTER TABLE alarmes_lembretes DROP CONSTRAINT IF EXISTS alarmes_lembretes_tipo_check;
ALTER TABLE alarmes_lembretes ADD CONSTRAINT alarmes_lembretes_tipo_check CHECK (tipo IN ('alarme', 'lembrete', 'tarefa'));

ALTER TABLE alarmes_lembretes DROP CONSTRAINT IF EXISTS alarmes_lembretes_prioridade_check;
ALTER TABLE alarmes_lembretes ADD CONSTRAINT alarmes_lembretes_prioridade_check CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));

ALTER TABLE alarmes_lembretes DROP CONSTRAINT IF EXISTS alarmes_lembretes_recorrencia_check;
ALTER TABLE alarmes_lembretes ADD CONSTRAINT alarmes_lembretes_recorrencia_check CHECK (recorrencia IN ('unica', 'diaria', 'semanal', 'mensal'));

ALTER TABLE alarmes_lembretes DROP CONSTRAINT IF EXISTS alarmes_lembretes_canal_check;
ALTER TABLE alarmes_lembretes ADD CONSTRAINT alarmes_lembretes_canal_check CHECK (canal_notificacao IN ('sistema', 'email', 'whatsapp', 'todos'));

-- 2.2. Tabelas Auxiliares
CREATE TABLE IF NOT EXISTS alarmes_notificacoes_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alarme_id UUID NOT NULL REFERENCES alarmes_lembretes(id) ON DELETE CASCADE,
    canal TEXT NOT NULL,
    status TEXT NOT NULL,
    erro_mensagem TEXT,
    enviado_em TIMESTAMP DEFAULT NOW()
);

ALTER TABLE alarmes_notificacoes_historico DROP CONSTRAINT IF EXISTS alarmes_notificacoes_status_check;
ALTER TABLE alarmes_notificacoes_historico ADD CONSTRAINT alarmes_notificacoes_status_check CHECK (status IN ('enviado', 'erro', 'lido'));

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

-- 2.3. Índices
CREATE INDEX IF NOT EXISTS idx_alarmes_tenant ON alarmes_lembretes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alarmes_usuario ON alarmes_lembretes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_alarmes_data_hora ON alarmes_lembretes(data_hora) WHERE ativo = true AND concluido = false;
CREATE INDEX IF NOT EXISTS idx_alarmes_tipo ON alarmes_lembretes(tipo);
CREATE INDEX IF NOT EXISTS idx_alarmes_prioridade ON alarmes_lembretes(prioridade);
CREATE INDEX IF NOT EXISTS idx_alarmes_vinculo ON alarmes_lembretes(vinculo_tipo, vinculo_id);
CREATE INDEX IF NOT EXISTS idx_alarmes_notificacoes_alarme ON alarmes_notificacoes_historico(alarme_id);

-- 2.4. RLS
ALTER TABLE alarmes_lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarmes_notificacoes_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarmes_templates ENABLE ROW LEVEL SECURITY;

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

-- 2.5. Funções
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

DROP FUNCTION IF EXISTS buscar_alarmes_pendentes(UUID, UUID, INTEGER);
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

-- 2.6. Templates
INSERT INTO alarmes_templates (nome, descricao, tipo, template_titulo, template_descricao, antecedencia_minutos, is_global)
SELECT * FROM (VALUES
    ('Lembrete de Consulta D-1', 'Lembrete 1 dia antes da consulta', 'lembrete', 'Consulta Amanhã', 'Lembrar de confirmar presença do paciente', 1440, true),
    ('Lembrete de Consulta H-3', 'Lembrete 3 horas antes', 'lembrete', 'Consulta em 3 horas', 'Paciente tem consulta daqui a 3 horas', 180, true),
    ('Alarme Pagamento Vencendo', 'Alerta de pagamento próximo', 'alarme', 'Pagamento Vencendo', 'Verificar pagamento pendente', 1440, true),
    ('Tarefa Follow-up', 'Tarefa de acompanhamento pós-consulta', 'tarefa', 'Follow-up Paciente', 'Entrar em contato para acompanhamento', 0, true),
    ('Lembrete Renovação Receita', 'Lembrete para renovar receita', 'lembrete', 'Renovar Receita', 'Paciente precisa renovar receita médica', 10080, true)
) AS t(nome, descricao, tipo, template_titulo, template_descricao, antecedencia_minutos, is_global)
WHERE NOT EXISTS (
    SELECT 1 FROM alarmes_templates WHERE is_global = true LIMIT 1
);

-- 2.7. View Dashboard
DROP VIEW IF EXISTS view_alarmes_dashboard;
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
-- 3. PREFERÊNCIA DE TEMA
-- ============================================================================

ALTER TABLE system_users ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';
ALTER TABLE system_users ALTER COLUMN theme_preference SET DEFAULT 'dark';

ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_theme_preference_check;
ALTER TABLE system_users ADD CONSTRAINT system_users_theme_preference_check 
    CHECK (theme_preference IN ('light', 'dark'));

COMMENT ON COLUMN system_users.theme_preference IS 'Preferência de tema do usuário de suporte (light ou dark)';

-- ============================================================================
-- 4. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CLINFLOW - CHECKUP FINAL V3 REALIZADO';
    RAISE NOTICE '============================================';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        RAISE NOTICE '✓ support_tickets: OK';
    ELSE
        RAISE NOTICE '✗ support_tickets: FALHA';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alarmes_lembretes') THEN
        RAISE NOTICE '✓ alarmes_lembretes: OK';
    ELSE
        RAISE NOTICE '✗ alarmes_lembretes: FALHA';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_users' AND column_name = 'theme_preference') THEN
        RAISE NOTICE '✓ theme_preference: OK';
    ELSE
        RAISE NOTICE '✗ theme_preference: FALHA';
    END IF;
END $$;
