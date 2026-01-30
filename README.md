# CleanFlow

O **CleanFlow** é um microSaaS de agendamento e gestão operacional para negócios que trabalham com hora marcada, como clínicas, estúdios, oficinas, estética e serviços em geral.

A ideia central é reduzir o caos operacional e automatizar tarefas repetitivas, deixando a equipe focada no atendimento e no faturamento.

---

## Como o CleanFlow funciona

O sistema é organizado em módulos que se integram em um único fluxo.

### 1. Agenda inteligente

A agenda é o núcleo do CleanFlow.

- Agendamento por profissional, serviço e unidade
- Visualização diária, semanal e mensal
- Bloqueio automático de horários indisponíveis
- Regras de duração por tipo de serviço
- Evita conflitos de agenda automaticamente

Cada agendamento gera um registro único que conecta cliente, serviço, profissional e valores.

---

### 2. Clientes (CRM simples)

O CleanFlow mantém um cadastro centralizado de clientes:

- Nome, telefone, e-mail e histórico
- Histórico completo de atendimentos
- Preferências e observações internas
- Associação direta com agendamentos e pagamentos

Isso permite atendimento mais rápido e personalizado.

---

### 3. Comunicação automatizada

O sistema envia mensagens automáticas para reduzir faltas e retrabalho.

- Confirmação de agendamento
- Lembretes automáticos
- Avisos de reagendamento ou cancelamento

Canais suportados:
- WhatsApp
- E-mail
- SMS (opcional)

As mensagens são disparadas com base em eventos da agenda.

---

### 4. Financeiro e caixa

Cada atendimento pode gerar movimentação financeira.

- Controle de valores recebidos
- Formas de pagamento (dinheiro, cartão, PIX, etc.)
- Caixa diário e relatórios
- Separação por unidade ou profissional

O objetivo é dar visão clara do faturamento sem depender de planilhas externas.

---

### 5. Ordens de serviço e orçamentos (opcional)

Para negócios que precisam de etapas antes da execução:

- Criação de orçamentos
- Aprovação pelo cliente
- Conversão automática em atendimento
- Histórico de alterações

Muito útil para oficinas, manutenção e serviços técnicos.

---

### 6. Multiunidade e multiusuário

O CleanFlow foi pensado para escalar.

- Suporte a múltiplas unidades
- Controle de permissões (admin, atendente, profissional)
- Cada usuário vê apenas o que precisa

Arquitetura multi-tenant desde a base.

---

### 7. LGPD e segurança

- Dados isolados por tenant
- Controle de acesso por perfil
- Logs de ações importantes
- Preparado para exclusão e anonimização de dados

---

## Objetivo do projeto

O CleanFlow não tenta ser um ERP gigante.

O foco é:
- Simplicidade
- Automação
- Fluxo claro de trabalho
- Menos tarefas manuais
- Mais previsibilidade operacional

---

## Stack tecnológica

- Frontend: React + Vite
- UI: Tailwind CSS + shadcn-ui
- Backend: API REST (FastAPI / Node, conforme ambiente)
- Banco de dados: PostgreSQL
- Integrações: WhatsApp, e-mail, SMS
- Deploy: Lovable / Netlify / Cloud

---

## Status

Projeto em evolução contínua, com foco em microSaaS escalável e modular.
