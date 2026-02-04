-- 1. Improved search function with better keyword matching logic
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
        1.0::float as similarity
    FROM support_knowledge_base skb
    WHERE 
        skb.is_active = true 
        AND (
            -- Direct question match (fuzzy)
            skb.question ILIKE '%' || search_query || '%'
            OR 
            -- Keyword match: Check if ANY keyword is present in the search query
            EXISTS (
                SELECT 1 
                FROM unnest(skb.keywords) k 
                WHERE search_query ILIKE '%' || k || '%'
            )
        )
    LIMIT 1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_knowledge_base TO anon, authenticated;

-- 2. Populate Knowledge Base with comprehensive data
TRUNCATE support_knowledge_base;

INSERT INTO support_knowledge_base (question, answer, keywords, is_active) VALUES
-- Greetings & Basics
('Olá', 'Olá! Sou o assistente virtual do CleanFlow. Como posso ajudar você hoje?', ARRAY['oi', 'ola', 'olá', 'hey', 'bom dia', 'boa tarde', 'boa noite', 'eai'], true),
('Quem é você?', 'Sou o CleanBot, seu assistente virtual para dúvidas sobre o sistema CleanFlow.', ARRAY['quem é voce', 'quem e voce', 'seu nome', 'bot', 'robo'], true),
('O que você faz?', 'Posso ajudar com dúvidas sobre agendamentos, cadastro de pacientes, financeiro e configurações do sistema.', ARRAY['o que faz', 'ajuda', 'funcionalidades', 'serviços'], true),

-- Scheduling (Agenda)
('Como agendar uma consulta?', 'Para agendar, vá para a aba "Agenda" no menu lateral. Clique no horário desejado ou no botão "Novo Agendamento" no topo da tela.', ARRAY['agendar', 'agenda', 'marcar', 'consulta', 'horario', 'compromisso'], true),
('Como cancelar um agendamento?', 'Na agenda, clique sobre o agendamento que deseja cancelar. Uma janela abrirá com a opção "Cancelar" ou o ícone de lixeira.', ARRAY['cancelar', 'desmarcar', 'excluir agendamento', 'remover consulta'], true),
('Posso bloquear horários?', 'Sim! Na agenda, clique e arraste para selecionar um período ou use a opção "Bloqueio" para fechar horários indisponíveis.', ARRAY['bloquear', 'bloqueio', 'fechar agenda', 'indisponivel'], true),

-- Patients (Pacientes)
('Como cadastrar paciente?', 'Acesse o menu "Pacientes" e clique no botão "Novo Paciente" no canto superior direito. Preencha os dados obrigatórios e salve.', ARRAY['paciente', 'cadastrar', 'novo paciente', 'registro', 'cliente'], true),
('Como ver o prontuário?', 'Na lista de pacientes, clique no nome do paciente. Isso abrirá o prontuário eletrônico com histórico, evoluções e anexos.', ARRAY['prontuario', 'historico', 'ficha', 'evolucao', 'anamnese'], true),
('Como anexar arquivos?', 'Dentro do prontuário do paciente, vá na aba "Anexos" ou "Arquivos" para fazer upload de exames e documentos.', ARRAY['anexar', 'arquivo', 'upload', 'exame', 'foto'], true),

-- Financial (Financeiro)
('Como lançar uma despesa?', 'No menu "Financeiro", vá em "Movimentações" e clique em "Nova Despesa". Categorize corretamente para melhor controle.', ARRAY['despesa', 'pagar', 'conta', 'gasto', 'saida'], true),
('Como lançar uma receita?', 'Receitas de consultas são lançadas automaticamente ao finalizar um atendimento. Para outras receitas, vá em "Financeiro" > "Nova Receita".', ARRAY['receita', 'ganho', 'entrada', 'faturamento'], true),
('Como emitir nota fiscal?', 'A emissão de NFe é feita pelo módulo fiscal. Certifique-se de ter seu certificado digital A1 configurado em "Configurações > Fiscal".', ARRAY['nota', 'fiscal', 'nfe', 'nota fiscal', 'emitir nota'], true),
('Quais os relatórios financeiros?', 'Em "Financeiro > Relatórios", você encontra DRE, Fluxo de Caixa e relatórios de produtividade por profissional.', ARRAY['relatorio', 'dre', 'fluxo de caixa', 'lucro'], true),

-- Account & Settings (Configurações)
('Como alterar minha senha?', 'Vá em "Perfil" (clique no seu avatar no canto superior) e selecione a aba "Segurança" para alterar sua senha.', ARRAY['senha', 'mudar senha', 'alterar senha', 'trocar senha'], true),
('Esqueci minha senha', 'Na tela de login, clique no link "Esqueci minha senha". Enviaremos um e-mail com instruções para redefinição.', ARRAY['esqueci', 'recuperar senha', 'perdi senha', 'resetar'], true),
('Como adicionar usuários?', 'Se você é administrador, vá em "Configurações > Usuários" e clique em "Convidar Usuário".', ARRAY['usuario', 'adicionar medico', 'secretaria', 'equipe'], true),

-- Plans & Billing (Planos)
('Quais são os planos?', 'Temos o plano Free (gratuito para iniciantes), Pro (R$ 299/mês com recursos avançados) e Clínica (R$ 699/mês para multi-usuários).', ARRAY['plano', 'preço', 'valor', 'custo', 'assinatura', 'pagamento'], true),
('Como fazer upgrade?', 'Acesse "Configurações > Assinatura" para ver seu plano atual e opções de upgrade.', ARRAY['upgrade', 'mudar plano', 'contratar'], true),

-- Support (Suporte)
('Preciso falar com um humano', 'Entendo. Vou notificar nossa equipe de suporte. Por favor, aguarde um momento ou envie um e-mail para suporte@cleanflow.com.br.', ARRAY['humano', 'atendente', 'pessoa', 'falar com gente', 'suporte tecnico'], true),
('Qual o telefone de contato?', 'Nosso atendimento é prioritariamente online via chat ou e-mail. Para urgências do plano Clínica, verifique o número no seu contrato.', ARRAY['telefone', 'celular', 'whatsapp', 'ligar', 'contato'], true);
