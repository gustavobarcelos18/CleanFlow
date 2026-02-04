import { Step } from 'react-joyride';

export const dashboardTourSteps: Step[] = [
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">Bem-vindo ao CleanFlow! 🎉</h2>
                <p>Vamos fazer um tour rápido pelas principais funcionalidades do sistema.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Você pode pular este tour a qualquer momento ou reiniciá-lo depois nas configurações.
                </p>
            </div>
        ),
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard-stats"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📊 Visão Geral</h3>
                <p>Aqui você vê um resumo rápido dos principais indicadores:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Total de agendamentos</li>
                    <li>Pacientes ativos</li>
                    <li>Taxa de ocupação</li>
                    <li>Receita do período</li>
                </ul>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="menu-agenda"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📅 Agenda</h3>
                <p>Gerencie todos os seus agendamentos em um só lugar.</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Visualização por dia, semana ou mês</li>
                    <li>Arrastar e soltar para reagendar</li>
                    <li>Confirmações automáticas por WhatsApp</li>
                </ul>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '[data-tour="menu-pacientes"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">👥 Pacientes</h3>
                <p>Cadastro completo de pacientes com:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Histórico de atendimentos</li>
                    <li>Prontuário eletrônico</li>
                    <li>Controle de faltas (no-show)</li>
                    <li>Preferências de contato</li>
                </ul>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '[data-tour="menu-whatsapp"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">💬 WhatsApp</h3>
                <p>Automatize sua comunicação:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Confirmações automáticas</li>
                    <li>Lembretes de consulta</li>
                    <li>Mensagens personalizadas</li>
                    <li>Histórico de conversas</li>
                </ul>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '[data-tour="menu-financeiro"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">💰 Financeiro</h3>
                <p>Controle completo das suas finanças:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Receitas e despesas</li>
                    <li>Fluxo de caixa</li>
                    <li>Relatórios financeiros</li>
                    <li>Integração com meios de pagamento</li>
                </ul>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '[data-tour="menu-relatorios"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📈 Relatórios</h3>
                <p>Análises detalhadas do seu negócio:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Desempenho de profissionais</li>
                    <li>Procedimentos mais realizados</li>
                    <li>Taxa de no-show</li>
                    <li>Exportação para Excel/PDF</li>
                </ul>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '[data-tour="user-menu"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">⚙️ Configurações</h3>
                <p>Personalize o sistema:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Dados do perfil</li>
                    <li>Configurações da clínica</li>
                    <li>Integrações</li>
                    <li>Reiniciar este tour</li>
                </ul>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">Pronto para começar! 🚀</h2>
                <p>Você já conhece as principais funcionalidades do CleanFlow.</p>
                <p className="mt-2">
                    Explore o sistema e, se precisar de ajuda, acesse a central de ajuda ou
                    reinicie este tour nas configurações.
                </p>
                <p className="mt-3 text-sm font-semibold text-primary">
                    Dica: Comece cadastrando seus pacientes e criando seus primeiros agendamentos!
                </p>
            </div>
        ),
        placement: 'center',
    },
];

export const agendaTourSteps: Step[] = [
    {
        target: '[data-tour="agenda-calendar"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📅 Calendário de Agendamentos</h3>
                <p>Visualize todos os seus compromissos de forma clara e organizada.</p>
            </div>
        ),
        placement: 'top',
    },
    {
        target: '[data-tour="novo-agendamento"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">➕ Novo Agendamento</h3>
                <p>Clique aqui para criar um novo agendamento rapidamente.</p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="filtros-agenda"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">🔍 Filtros</h3>
                <p>Filtre agendamentos por profissional, status ou tipo de serviço.</p>
            </div>
        ),
        placement: 'bottom',
    },
];

export const pacientesTourSteps: Step[] = [
    {
        target: '[data-tour="novo-paciente"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">👤 Cadastrar Paciente</h3>
                <p>Adicione novos pacientes com informações completas de contato e histórico.</p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="busca-paciente"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">🔍 Buscar Paciente</h3>
                <p>Encontre rapidamente qualquer paciente por nome, telefone ou e-mail.</p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="lista-pacientes"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📋 Lista de Pacientes</h3>
                <p>Veja informações importantes como:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Risco de no-show</li>
                    <li>Histórico de faltas</li>
                    <li>Último atendimento</li>
                </ul>
            </div>
        ),
        placement: 'top',
    },
];

export const financeiroTourSteps: Step[] = [
    {
        target: '[data-tour="resumo-financeiro"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">💰 Resumo Financeiro</h3>
                <p>Acompanhe receitas, despesas e saldo em tempo real.</p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="nova-receita"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">➕ Lançar Receita</h3>
                <p>Registre pagamentos de consultas e procedimentos.</p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="nova-despesa"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">➖ Lançar Despesa</h3>
                <p>Controle todas as despesas da sua clínica.</p>
            </div>
        ),
        placement: 'bottom',
    },
];

export const configuracoesTourSteps: Step[] = [
    {
        target: '[data-tour="config-clinica"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">🏥 Dados da Clínica</h3>
                <p>Configure informações básicas como nome, endereço e horários de funcionamento.</p>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '[data-tour="config-whatsapp"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">💬 WhatsApp</h3>
                <p>Configure a integração com WhatsApp para automações.</p>
            </div>
        ),
        placement: 'right',
    },
    {
        target: '[data-tour="config-planos"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">💳 Planos e Assinatura</h3>
                <p>Gerencie seu plano atual e veja opções de upgrade.</p>
            </div>
        ),
        placement: 'right',
    },
];
