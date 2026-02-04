-- Migration para sistema de alarmes e lembretes
-- 20251207193000_alarmes_lembretes_system.sql

-- 1. Criar tabela de alarmes/lembretes
CREATE TABLE IF NOT EXISTS alarmes_lembretes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL, -- 'alarme', 'lembrete', 'tarefa'
    prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
    data_hora TIMESTAMP NOT NULL,
    recorrencia TEXT, -- 'unica', 'diaria', 'semanal', 'mensal'
    dias_semana INTEGER[], -- [0-6] para recorrência semanal (0=domingo)
    ativo BOOLEAN DEFAULT true,
    concluido BOOLEAN DEFAULT false,
    concluido_em TIMESTAMP,
    concluido_por UUID REFERENCES profiles(id),
    notificacao_enviada BOOLEAN DEFAULT false,
    notificacao_enviada_em TIMESTAMP,
    canal_notificacao TEXT DEFAULT 'sistema', -- 'sistema', 'email', 'whatsapp', 'todos'
    vinculo_tipo TEXT, -- 'agendamento', 'paciente', 'ticket', 'financeiro'
    vinculo_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar tabela de histórico de notificações
CREATE TABLE IF NOT EXISTS alarmes_notificacoes_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alarme_id UUID NOT NULL REFERENCES alarmes_lembretes(id) ON DELETE CASCADE,
    canal TEXT NOT NULL,
    status TEXT NOT NULL, -- 'enviado', 'erro', 'lido'
    erro_mensagem TEXT,
    enviado_em TIMESTAMP DEFAULT NOW()
);

-- 3. Criar tabela de templates de lembretes
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
    is_global BOOLEAN DEFAULT false, -- Templates globais do sistema
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_alarmes_tenant ON alarmes_lembretes(tenant_id);
CREATE INDEX idx_alarmes_usuario ON alarmes_lembretes(usuario_id);
CREATE INDEX idx_alarmes_data_hora ON alarmes_lembretes(data_hora) WHERE ativo = true AND concluido = false;
CREATE INDEX idx_alarmes_tipo ON alarmes_lembretes(tipo);
CREATE INDEX idx_alarmes_prioridade ON alarmes_lembretes(prioridade);
CREATE INDEX idx_alarmes_vinculo ON alarmes_lembretes(vinculo_tipo, vinculo_id);
CREATE INDEX idx_alarmes_notificacoes_alarme ON alarmes_notificacoes_historico(alarme_id);

-- RLS
ALTER TABLE alarmes_lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarmes_notificacoes_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarmes_templates ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY alarmes_tenant_isolation ON alarmes_lembretes
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR usuario_id = auth.uid()
    );

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

CREATE POLICY alarmes_templates_access ON alarmes_templates
    FOR ALL USING (
        is_global = true
        OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_alarme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alarmes_updated_at
    BEFORE UPDATE ON alarmes_lembretes
    FOR EACH ROW
    EXECUTE FUNCTION update_alarme_updated_at();

-- Função para marcar como concluído
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

-- Função para buscar alarmes pendentes
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

-- Função para criar alarme a partir de template
CREATE OR REPLACE FUNCTION criar_alarme_de_template(
    p_template_id UUID,
    p_tenant_id UUID,
    p_usuario_id UUID,
    p_data_hora TIMESTAMP,
    p_vinculo_tipo TEXT DEFAULT NULL,
    p_vinculo_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_alarme_id UUID;
BEGIN
    -- Buscar template
    SELECT * INTO v_template FROM alarmes_templates WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template não encontrado';
    END IF;
    
    -- Criar alarme
    INSERT INTO alarmes_lembretes (
        tenant_id,
        usuario_id,
        titulo,
        descricao,
        tipo,
        data_hora,
        canal_notificacao,
        vinculo_tipo,
        vinculo_id
    ) VALUES (
        p_tenant_id,
        p_usuario_id,
        v_template.template_titulo,
        v_template.template_descricao,
        v_template.tipo,
        p_data_hora - (v_template.antecedencia_minutos || ' minutes')::INTERVAL,
        v_template.canal_padrao,
        p_vinculo_tipo,
        p_vinculo_id
    )
    RETURNING id INTO v_alarme_id;
    
    RETURN v_alarme_id;
END;
$$ LANGUAGE plpgsql;

-- Inserir templates globais padrão
INSERT INTO alarmes_templates (nome, descricao, tipo, template_titulo, template_descricao, antecedencia_minutos, is_global)
VALUES
    ('Lembrete de Consulta D-1', 'Lembrete 1 dia antes da consulta', 'lembrete', 'Consulta Amanhã', 'Lembrar de confirmar presença do paciente', 1440, true),
    ('Lembrete de Consulta H-3', 'Lembrete 3 horas antes', 'lembrete', 'Consulta em 3 horas', 'Paciente tem consulta daqui a 3 horas', 180, true),
    ('Alarme Pagamento Vencendo', 'Alerta de pagamento próximo', 'alarme', 'Pagamento Vencendo', 'Verificar pagamento pendente', 1440, true),
    ('Tarefa Follow-up', 'Tarefa de acompanhamento pós-consulta', 'tarefa', 'Follow-up Paciente', 'Entrar em contato para acompanhamento', 0, true),
    ('Lembrete Renovação Receita', 'Lembrete para renovar receita', 'lembrete', 'Renovar Receita', 'Paciente precisa renovar receita médica', 10080, true);

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

-- Comentários
COMMENT ON TABLE alarmes_lembretes IS 'Sistema de alarmes, lembretes e tarefas';
COMMENT ON TABLE alarmes_notificacoes_historico IS 'Histórico de notificações enviadas';
COMMENT ON TABLE alarmes_templates IS 'Templates pré-configurados de alarmes';
COMMENT ON COLUMN alarmes_lembretes.tipo IS 'Tipo: alarme (urgente), lembrete (informativo), tarefa (ação)';
COMMENT ON COLUMN alarmes_lembretes.recorrencia IS 'Frequência: unica, diaria, semanal, mensal';
COMMENT ON COLUMN alarmes_lembretes.canal_notificacao IS 'Canal: sistema, email, whatsapp, todos';
COMMENT ON FUNCTION buscar_alarmes_pendentes IS 'Busca alarmes pendentes ordenados por prioridade e data';
COMMENT ON FUNCTION criar_alarme_de_template IS 'Cria alarme baseado em template pré-configurado';
