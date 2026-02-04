# Testes Automatizados - CleanFlow

Este projeto possui uma camada de testes automatizados para garantir a estabilidade de fluxos críticos de negócio.

## Estrutura

- **Frontend / Domínio (Vitest)**: Testes unitários para serviços de domínio (`src/domain`).
- **Edge Functions (Deno)**: Testes unitários para lógica de funções server-side (`supabase/functions`).

## Como Rodar

### Frontend / Domínio

Certifique-se de ter as dependências instaladas:
```bash
npm install
```

Para rodar os testes:
```bash
npm test
```

Isso executará os testes localizados em `src/**/__tests__/*.test.ts`.

### Edge Functions

Para rodar os testes das Edge Functions, você precisa ter o Deno instalado.

```bash
deno test supabase/functions/apply-retention-policies/test.ts
```

## Cobertura Atual

### 1. Billing (`src/domain/billing`)
- **`billingService`**:
  - Carregamento de assinatura e cálculo de assentos extras.
  - Verificação de limites do plano.
  - Agendamento de downgrade.

### 2. WhatsApp (`src/domain/whatsapp`)
- **`whatsappService`**:
  - Enfileiramento de mensagens operacionais.
  - Verificação de consentimento para mensagens de marketing.
  - Validação de status inicial (`queued`).

### 3. Retenção de Dados (`supabase/functions/apply-retention-policies`)
- **Lógica de aplicação**:
  - Simulação de busca de políticas ativas.
  - Verificação de deleção de registros antigos.
  - Atualização de timestamp de última execução.

## Plano de Expansão

1.  **Integração**: Adicionar testes de integração que simulem o fluxo completo (Frontend -> Supabase -> Edge Function) usando um projeto Supabase local (`supabase start`).
2.  **Componentes**: Adicionar testes de componentes React (`.test.tsx`) para verificar renderização correta de telas críticas como `BillingBanner` e `WhatsAppMetrics`.
3.  **E2E**: Implementar testes End-to-End com Playwright ou Cypress para fluxos de onboarding e checkout.
