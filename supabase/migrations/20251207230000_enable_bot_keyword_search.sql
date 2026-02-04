-- Enable bot responses with keyword search
-- 20251207230000_enable_bot_keyword_search.sql

-- 1. Populate Knowledge Base with initial data
INSERT INTO support_knowledge_base (question, answer, keywords, is_active)
VALUES 
    ('Como agendar uma consulta?', 'Para agendar, acesse a aba "Agenda" no menu principal ou clique no botão "Novo Agendamento".', ARRAY['agendar', 'consulta', 'marcar', 'horario'], true),
    ('Qual o valor dos planos?', 'Temos planos a partir de R$ 0,00 (Free). O plano Pro custa R$ 299,00 e o Clínica R$ 699,00. Confira detalhes na página de Planos.', ARRAY['preço', 'valor', 'plano', 'custo', 'pagamento'], true),
    ('Como resetar minha senha?', 'Você pode alterar sua senha na tela de login clicando em "Esqueci minha senha" ou nas configurações do seu perfil.', ARRAY['senha', 'resetar', 'recuperar', 'esqueci'], true),
    ('Vocês têm suporte por telefone?', 'Nosso suporte é prioritariamente via chat ou email. Para casos urgentes, o plano Clínica oferece suporte dedicado.', ARRAY['telefone', 'contato', 'whatsapp', 'ligar'], true),
    ('Como cadastrar paciente?', 'Vá até a aba "Pacientes" e clique em "Novo Paciente". Preencha os dados obrigatórios e salve.', ARRAY['paciente', 'cadastrar', 'novo', 'registro'], true),
    ('O sistema emite nota fiscal?', 'Sim, o CleanFlow possui módulo financeiro que auxilia na emissão de notas e controle de caixa.', ARRAY['nota', 'fiscal', 'nfe', 'financeiro'], true)
ON CONFLICT DO NOTHING;

-- 2. Create search function (Keyword based for simplicity and speed)
CREATE OR REPLACE FUNCTION search_knowledge_base(search_query text)
RETURNS TABLE (
    id uuid,
    question text,
    answer text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        skb.id,
        skb.question,
        skb.answer,
        CASE 
            WHEN skb.question ILIKE '%' || search_query || '%' THEN 1.0
            WHEN EXISTS (SELECT 1 FROM unnest(skb.keywords) k WHERE search_query ILIKE '%' || k || '%') THEN 0.8
            ELSE 0.0
        END::float as similarity
    FROM support_knowledge_base skb
    WHERE skb.is_active = true
    AND (
        skb.question ILIKE '%' || search_query || '%'
        OR EXISTS (SELECT 1 FROM unnest(skb.keywords) k WHERE search_query ILIKE '%' || k || '%')
    )
    ORDER BY similarity DESC
    LIMIT 5;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION search_knowledge_base TO anon, authenticated;
GRANT SELECT ON TABLE support_knowledge_base TO anon, authenticated;
