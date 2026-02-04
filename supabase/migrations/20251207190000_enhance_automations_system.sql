-- Adicionar novos gatilhos e funcionalidades ao sistema de automações
-- Migration: 20251207190000_enhance_automations_system.sql

-- 1. Adicionar novos tipos de gatilhos
COMMENT ON COLUMN automations_nodes.tipo IS 'Tipos: trigger, action, condition, delay, branch';

-- 2. Criar tabela de lista de espera
CREATE TABLE IF NOT EXISTS lista_espera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    profissional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    unidade_id UUID REFERENCES units(id) ON DELETE SET NULL,
    prioridade INTEGER DEFAULT 0, -- 0=normal, 1=alta, 2=urgente
    data_preferencial DATE,
    horario_preferencial TIME,
    periodo_preferencial TEXT, -- 'manha', 'tarde', 'noite', 'qualquer'
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    notificado_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para lista de espera
CREATE INDEX idx_lista_espera_tenant ON lista_espera(tenant_id);
CREATE INDEX idx_lista_espera_ativo ON lista_espera(ativo) WHERE ativo = true;
CREATE INDEX idx_lista_espera_prioridade ON lista_espera(prioridade DESC, created_at ASC);

-- RLS para lista de espera
ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

CREATE POLICY lista_espera_tenant_isolation ON lista_espera
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 3. Criar tabela de ofertas de encaixe
CREATE TABLE IF NOT EXISTS encaixe_ofertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lista_espera_id UUID NOT NULL REFERENCES lista_espera(id) ON DELETE CASCADE,
    horario_disponivel_inicio TIMESTAMP NOT NULL,
    horario_disponivel_fim TIMESTAMP NOT NULL,
    profissional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    unidade_id UUID REFERENCES units(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'aceito', 'recusado', 'expirado'
    mensagem_enviada_em TIMESTAMP,
    resposta_recebida_em TIMESTAMP,
    expira_em TIMESTAMP,
    agendamento_id UUID REFERENCES agenda(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para ofertas
CREATE INDEX idx_encaixe_ofertas_tenant ON encaixe_ofertas(tenant_id);
CREATE INDEX idx_encaixe_ofertas_status ON encaixe_ofertas(status);
CREATE INDEX idx_encaixe_ofertas_expiracao ON encaixe_ofertas(expira_em) WHERE status = 'pendente';

-- RLS para ofertas
ALTER TABLE encaixe_ofertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY encaixe_ofertas_tenant_isolation ON encaixe_ofertas
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 4. Criar tabela de respostas automáticas (NLP básico)
CREATE TABLE IF NOT EXISTS whatsapp_auto_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    palavra_chave TEXT NOT NULL,
    tipo_resposta TEXT NOT NULL, -- 'confirmacao', 'cancelamento', 'reagendamento', 'encaixe'
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir respostas padrão
INSERT INTO whatsapp_auto_responses (tenant_id, palavra_chave, tipo_resposta) 
SELECT 
    t.id,
    palavra,
    tipo
FROM tenants t
CROSS JOIN (
    VALUES 
        ('sim', 'confirmacao'),
        ('confirmo', 'confirmacao'),
        ('ok', 'confirmacao'),
        ('1', 'confirmacao'),
        ('nao', 'cancelamento'),
        ('não', 'cancelamento'),
        ('cancelar', 'cancelamento'),
        ('2', 'cancelamento'),
        ('reagendar', 'reagendamento'),
        ('mudar', 'reagendamento'),
        ('quero', 'encaixe'),
        ('aceito', 'encaixe')
) AS palavras(palavra, tipo)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE whatsapp_auto_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_auto_responses_tenant_isolation ON whatsapp_auto_responses
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- 5. Adicionar campos na tabela agenda para tracking
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP;
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS confirmado_via TEXT; -- 'whatsapp', 'telefone', 'presencial', 'email'
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS lembrete_d2_enviado BOOLEAN DEFAULT false;
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS lembrete_h3_enviado BOOLEAN DEFAULT false;
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS origem_encaixe BOOLEAN DEFAULT false;
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS oferta_encaixe_id UUID REFERENCES encaixe_ofertas(id);

-- 6. Criar função para buscar próximo da lista de espera
CREATE OR REPLACE FUNCTION buscar_proximo_lista_espera(
    p_tenant_id UUID,
    p_horario_inicio TIMESTAMP,
    p_horario_fim TIMESTAMP,
    p_profissional_id UUID DEFAULT NULL,
    p_unidade_id UUID DEFAULT NULL
)
RETURNS TABLE (
    lista_espera_id UUID,
    paciente_id UUID,
    paciente_nome TEXT,
    paciente_telefone TEXT,
    prioridade INTEGER,
    tempo_espera INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        le.id,
        le.paciente_id,
        p.nome,
        p.telefone,
        le.prioridade,
        NOW() - le.created_at as tempo_espera
    FROM lista_espera le
    INNER JOIN pacientes p ON p.id = le.paciente_id
    WHERE le.tenant_id = p_tenant_id
        AND le.ativo = true
        AND (p_profissional_id IS NULL OR le.profissional_id = p_profissional_id OR le.profissional_id IS NULL)
        AND (p_unidade_id IS NULL OR le.unidade_id = p_unidade_id OR le.unidade_id IS NULL)
        -- Verificar se não tem oferta pendente recente (últimas 2 horas)
        AND NOT EXISTS (
            SELECT 1 FROM encaixe_ofertas eo
            WHERE eo.lista_espera_id = le.id
                AND eo.status = 'pendente'
                AND eo.created_at > NOW() - INTERVAL '2 hours'
        )
    ORDER BY 
        le.prioridade DESC,
        le.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para criar oferta de encaixe
CREATE OR REPLACE FUNCTION criar_oferta_encaixe(
    p_tenant_id UUID,
    p_lista_espera_id UUID,
    p_horario_inicio TIMESTAMP,
    p_horario_fim TIMESTAMP,
    p_profissional_id UUID,
    p_unidade_id UUID,
    p_expira_minutos INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
    v_oferta_id UUID;
BEGIN
    INSERT INTO encaixe_ofertas (
        tenant_id,
        lista_espera_id,
        horario_disponivel_inicio,
        horario_disponivel_fim,
        profissional_id,
        unidade_id,
        expira_em
    ) VALUES (
        p_tenant_id,
        p_lista_espera_id,
        p_horario_inicio,
        p_horario_fim,
        p_profissional_id,
        p_unidade_id,
        NOW() + (p_expira_minutos || ' minutes')::INTERVAL
    )
    RETURNING id INTO v_oferta_id;
    
    RETURN v_oferta_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar função para processar resposta de encaixe
CREATE OR REPLACE FUNCTION processar_resposta_encaixe(
    p_oferta_id UUID,
    p_aceito BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_agendamento_id UUID;
    v_oferta RECORD;
    v_lista_espera RECORD;
BEGIN
    -- Buscar oferta
    SELECT * INTO v_oferta FROM encaixe_ofertas WHERE id = p_oferta_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oferta não encontrada';
    END IF;
    
    IF v_oferta.status != 'pendente' THEN
        RAISE EXCEPTION 'Oferta já foi processada';
    END IF;
    
    IF NOW() > v_oferta.expira_em THEN
        UPDATE encaixe_ofertas SET status = 'expirado' WHERE id = p_oferta_id;
        RAISE EXCEPTION 'Oferta expirada';
    END IF;
    
    -- Atualizar status da oferta
    UPDATE encaixe_ofertas 
    SET 
        status = CASE WHEN p_aceito THEN 'aceito' ELSE 'recusado' END,
        resposta_recebida_em = NOW()
    WHERE id = p_oferta_id;
    
    IF p_aceito THEN
        -- Buscar dados da lista de espera
        SELECT * INTO v_lista_espera FROM lista_espera WHERE id = v_oferta.lista_espera_id;
        
        -- Criar agendamento
        INSERT INTO agenda (
            tenant_id,
            paciente_id,
            profissional_id,
            unidade_id,
            servico_id,
            inicio,
            fim,
            status,
            confirmado,
            confirmado_em,
            confirmado_via,
            origem_encaixe,
            oferta_encaixe_id
        ) VALUES (
            v_oferta.tenant_id,
            v_lista_espera.paciente_id,
            v_oferta.profissional_id,
            v_oferta.unidade_id,
            v_lista_espera.servico_id,
            v_oferta.horario_disponivel_inicio,
            v_oferta.horario_disponivel_fim,
            'agendado',
            true,
            NOW(),
            'whatsapp',
            true,
            p_oferta_id
        )
        RETURNING id INTO v_agendamento_id;
        
        -- Atualizar oferta com ID do agendamento
        UPDATE encaixe_ofertas SET agendamento_id = v_agendamento_id WHERE id = p_oferta_id;
        
        -- Desativar da lista de espera
        UPDATE lista_espera SET ativo = false WHERE id = v_oferta.lista_espera_id;
        
        RETURN v_agendamento_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar view para monitoramento de encaixe
CREATE OR REPLACE VIEW view_encaixe_analytics AS
SELECT 
    t.id as tenant_id,
    t.nome as tenant_nome,
    COUNT(DISTINCT le.id) FILTER (WHERE le.ativo = true) as lista_espera_ativos,
    COUNT(DISTINCT eo.id) FILTER (WHERE eo.status = 'pendente') as ofertas_pendentes,
    COUNT(DISTINCT eo.id) FILTER (WHERE eo.status = 'aceito') as ofertas_aceitas,
    COUNT(DISTINCT eo.id) FILTER (WHERE eo.status = 'recusado') as ofertas_recusadas,
    COUNT(DISTINCT eo.id) FILTER (WHERE eo.status = 'expirado') as ofertas_expiradas,
    ROUND(
        COUNT(DISTINCT eo.id) FILTER (WHERE eo.status = 'aceito')::NUMERIC * 100.0 / 
        NULLIF(COUNT(DISTINCT eo.id) FILTER (WHERE eo.status IN ('aceito', 'recusado', 'expirado')), 0),
        2
    ) as taxa_aceitacao_pct,
    AVG(EXTRACT(EPOCH FROM (eo.resposta_recebida_em - eo.mensagem_enviada_em)) / 60) FILTER (WHERE eo.resposta_recebida_em IS NOT NULL) as tempo_medio_resposta_min
FROM tenants t
LEFT JOIN lista_espera le ON le.tenant_id = t.id
LEFT JOIN encaixe_ofertas eo ON eo.tenant_id = t.id AND eo.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.id, t.nome;

-- Permissões
GRANT SELECT ON view_encaixe_analytics TO authenticated;

-- 10. Comentários
COMMENT ON TABLE lista_espera IS 'Lista de espera para encaixe automático de agendamentos';
COMMENT ON TABLE encaixe_ofertas IS 'Ofertas de encaixe enviadas para pacientes da lista de espera';
COMMENT ON TABLE whatsapp_auto_responses IS 'Palavras-chave para processamento automático de respostas';
COMMENT ON FUNCTION buscar_proximo_lista_espera IS 'Busca próximo paciente elegível da lista de espera';
COMMENT ON FUNCTION criar_oferta_encaixe IS 'Cria uma oferta de encaixe para um paciente';
COMMENT ON FUNCTION processar_resposta_encaixe IS 'Processa resposta do paciente (aceita ou recusa)';
