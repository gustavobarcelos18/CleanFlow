# CleanFlow (ClinFlow)

Micro SaaS multi-tenant para agendamentos e operação de negócios com hora marcada.

## Visão

O CleanFlow centraliza agenda, atendimento, comunicação com clientes e rotinas operacionais em um único sistema. A proposta é reduzir no-show, organizar a operação e dar previsibilidade ao dia a dia, sem depender de planilhas, anotações soltas e conversas perdidas.

## Para quem é

- clínicas e consultórios
- estética e bem-estar, salão, barbearia
- oficinas e assistências técnicas
- qualquer negócio que vende tempo e atendimento com agenda

## Principais recursos

### Agenda e atendimento
- agenda com múltiplos profissionais
- reagendamento, cancelamento e gestão de disponibilidade
- lista de espera
- visualização por dia, semana e agenda do profissional

### Comunicação e relacionamento
- trilha de comunicação por cliente
- notificações e lembretes automatizáveis, conforme integrações configuradas
- histórico centralizado por atendimento

### Financeiro e operação
- caixa, entradas e saídas
- relatórios operacionais por período e por unidade
- ordens de serviço e orçamentos, quando aplicável
- compras e suprimentos, quando aplicável

### Multiunidades e permissões
- multi-tenant, isolamento por organização
- multiunidades com visão consolidada
- RBAC, perfis e permissões por função

### LGPD by design
- coleta do mínimo necessário
- controle de acesso por função
- exportação e exclusão sob demanda, quando aplicável
- trilha de auditoria para ações críticas

## Stack atual

### Frontend
- Vite 5
- React 18
- TypeScript 5
- React Router DOM 6
- Tailwind CSS 3, tailwindcss-animate, typography
- UI premium com shadcn/ui na prática via Radix UI
- Ícones com lucide-react
- Tema claro e escuro com next-themes

### Dados, estado e validação
- Supabase JS v2, autenticação e banco Postgres via Supabase
- TanStack React Query v5 para cache e sincronização de dados
- Zustand para estado global leve
- React Hook Form + Zod para formulários e validação

### Componentes e UX
- dnd-kit para drag and drop
- Recharts para gráficos
- Sonner para toasts
- Vaul para drawers
- cmdk para command palette
- react-resizable-panels para layouts redimensionáveis
- react-joyride para onboarding guiado
- date-fns e react-day-picker para datas e calendário
- embla-carousel-react para carrossel
- input-otp para OTP

### Relatórios
- jsPDF e jspdf-autotable para geração de PDF

### Qualidade e testes
- ESLint 9 com typescript-eslint
- Vitest 4 com Testing Library e jsdom

## Estrutura do projeto

- src, aplicação React
- public, assets públicos
- supabase, estrutura e recursos do Supabase
- scripts, scripts auxiliares
- dist, build do frontend

## Pré-requisitos

- Node.js 18 ou superior
- npm ou bun, escolha um e padronize no projeto
- conta e projeto no Supabase, para autenticação e banco

## Configuração

### Variáveis de ambiente

Use o arquivo `.env.example` como base e crie um `.env` na raiz do projeto.

Exemplo típico:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Todas as variáveis (frontend, edge functions e WhatsApp worker) estão descritas em `docs/CONFIGURACAO_AMBIENTE.md`.

## Roadmap

### Próximos incrementos recomendados
- padronizar runtime e lockfile, npm ou bun, e limpar o outro
- criar um fluxo de setup único, dev, staging, produção
- consolidar seeds e migrações do banco, evitando SQL solto sem versão
- definir políticas de Row Level Security no Supabase por organização e unidade
- adicionar logs de auditoria para ações críticas, login, alteração de permissões, cancelamentos, estornos

### Evoluções de produto
- automações de confirmação e lembretes, com regras por serviço e por unidade
- lista de espera inteligente, preenchimento automático de horários vagos
- relatórios de no-show, ocupação, ticket médio e retorno por período
- trilha do cliente, histórico, recorrência, preferências, anexos
- multiunidade avançado, metas e performance por equipe

## Convenções

### Padrões de código
- TypeScript sempre
- componentes e estilos com Tailwind
- validação com Zod
- formulários com React Hook Form
- dados remotos via React Query
- estado global apenas quando necessário, via Zustand

### Padrões de commit
Sugestão simples:
- feat: nova funcionalidade
- fix: correção
- refactor: refatoração sem mudança de comportamento
- docs: documentação
- test: testes
- chore: manutenção

## Troubleshooting

### O Vite sobe mas a tela fica em branco
- verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão no `.env`
- confira no console do navegador se há erro de rota ou import
- rode `npm run lint` para pegar erro bobo de TypeScript

### Erros estranhos depois de instalar dependências
- você provavelmente misturou npm e bun
- escolha um gerenciador, apague `node_modules` e reinstale

Com npm:
```bash
rm -rf node_modules
npm install
