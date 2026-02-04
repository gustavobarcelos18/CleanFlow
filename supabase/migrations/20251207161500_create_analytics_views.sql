-- View: view_analytics_ocupacao_diaria
-- Agrega ocupação por dia, unidade e profissional
CREATE OR REPLACE VIEW public.view_analytics_ocupacao_diaria AS
SELECT
    date_trunc('day', a.inicio) AS data,
    a.tenant_id,
    p.unidade_id,
    a.profissional_id,
    COUNT(*) AS total_agendamentos,
    SUM(EXTRACT(EPOCH FROM (a.fim - a.inicio))/3600) AS horas_ocupadas,
    -- Estimativa simplificada: 8h úteis por dia por profissional
    (COUNT(*) * 100.0 / NULLIF(8 * COUNT(DISTINCT a.profissional_id), 0))::numeric(5,2) AS taxa_ocupacao_estimada
FROM
    public.agenda a
JOIN
    public.profiles p ON a.profissional_id = p.id
WHERE
    a.status NOT IN ('cancelado', 'nao_compareceu')
GROUP BY
    1, 2, 3, 4;

-- View: view_analytics_no_show
-- Agrega estatísticas de no-show
CREATE OR REPLACE VIEW public.view_analytics_no_show AS
SELECT
    date_trunc('day', a.inicio) AS data,
    a.tenant_id,
    p.unidade_id,
    a.profissional_id,
    COUNT(*) AS total_agendamentos,
    COUNT(*) FILTER (WHERE a.status = 'nao_compareceu') AS total_no_show,
    (COUNT(*) FILTER (WHERE a.status = 'nao_compareceu') * 100.0 / NULLIF(COUNT(*), 0))::numeric(5,2) AS taxa_no_show,
    AVG(a.no_show_score)::numeric(5,2) AS media_no_show_score
FROM
    public.agenda a
JOIN
    public.profiles p ON a.profissional_id = p.id
WHERE
    a.status IN ('realizado', 'nao_compareceu', 'confirmado', 'agendado') -- Considerar apenas agendamentos válidos para cálculo
GROUP BY
    1, 2, 3, 4;

-- View: view_analytics_mensageria
-- Agrega estatísticas de mensagens (WhatsApp Outbox)
CREATE OR REPLACE VIEW public.view_analytics_mensageria AS
SELECT
    date_trunc('day', w.created_at) AS data,
    w.tenant_id,
    w.message_type AS tipo, -- 'operacional', 'marketing'
    COUNT(*) AS enviados,
    COUNT(*) FILTER (WHERE w.status = 'sent') AS entregues,
    COUNT(*) FILTER (WHERE w.status = 'failed') AS falhas,
    -- Mock de leitura (não temos tracking real ainda)
    0 AS lidos,
    (COUNT(*) FILTER (WHERE w.status = 'sent') * 100.0 / NULLIF(COUNT(*), 0))::numeric(5,2) AS taxa_entrega
FROM
    public.whatsapp_outbox w
GROUP BY
    1, 2, 3;

-- View: view_analytics_automacoes
-- Agrega estatísticas de automações
CREATE OR REPLACE VIEW public.view_analytics_automacoes AS
SELECT
    date_trunc('day', l.created_at) AS data,
    l.tenant_id,
    l.flow_id,
    f.nome AS nome_flow,
    COUNT(*) AS execucoes,
    COUNT(*) FILTER (WHERE l.status = 'success') AS sucessos,
    COUNT(*) FILTER (WHERE l.status = 'error') AS erros
FROM
    public.automation_logs l
LEFT JOIN
    public.automations_flows f ON l.flow_id = f.id
GROUP BY
    1, 2, 3, 4;

-- RLS não se aplica diretamente a Views no Supabase/Postgres da mesma forma que tabelas,
-- mas como as views consultam tabelas com RLS, o acesso direto via API do Supabase
-- respeitará as políticas das tabelas subjacentes SE a view for definida com SECURITY INVOKER (padrão).
-- Porém, para garantir performance e acesso correto via API, é comum criar funções RPC ou
-- garantir que o usuário tenha permissão de SELECT nas views.

-- Garantir permissões
GRANT SELECT ON public.view_analytics_ocupacao_diaria TO authenticated;
GRANT SELECT ON public.view_analytics_no_show TO authenticated;
GRANT SELECT ON public.view_analytics_mensageria TO authenticated;
GRANT SELECT ON public.view_analytics_automacoes TO authenticated;
