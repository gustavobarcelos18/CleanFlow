# Configuração de Ambiente

Este documento descreve as variáveis de ambiente necessárias para rodar o projeto e como configurar um usuário administrador em ambiente de desenvolvimento.

## Variáveis de Ambiente

Arquivos `.env` **NUNCA** devem ser versionados. Cada componente tem um modelo `.env.example` versionado ao lado de onde é usado:

| Componente | Modelo | Como usar |
|---|---|---|
| Frontend (Vite) | `.env.example` | copie para `.env` na raiz |
| Edge functions do Supabase | `supabase/functions/.env.example` | copie para `supabase/functions/.env` |
| WhatsApp worker | `whatsapp-worker/.env.example` | copie para `whatsapp-worker/.env` ou defina no ambiente do Docker |

### Frontend

Estas variáveis vão para o navegador: use somente a chave pública.

- `VITE_SUPABASE_URL`: URL da API do Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave pública (anon / publishable) do Supabase.

### Edge functions

Em produção, grave os secrets com `supabase secrets set --env-file supabase/functions/.env`. Localmente, use `supabase functions serve --env-file supabase/functions/.env`.

| Variável | Para que serve | Usada por |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Acesso ao projeto. O Supabase injeta; não as coloque no env-file (o CLI ignora o prefixo `SUPABASE_`). | quase todas as functions |
| `ALLOWED_ORIGINS` | Origens CORS permitidas, separadas por vírgula | `_shared/cors.ts`, `create-user` |
| `FUNCTIONS_REGION` | Quando definida, desliga o fallback de CORS para localhost | `_shared/cors.ts` |
| `STRIPE_SECRET_KEY` | Chave secreta da Stripe | functions de cobrança e assinatura |
| `STRIPE_WEBHOOK_SECRET` | Assinatura do webhook da Stripe | `stripe-webhook`, `billing-webhook` |
| `STRIPE_PHONE_WEBHOOK_SECRET` | Assinatura do webhook de números de telefone | `webhook-phone-subscription` |
| `WHATSAPP_ACCESS_TOKEN` | Token da WhatsApp Cloud API da Meta | `enviar-whatsapp`, `send-whatsapp-batch` |
| `SERPRO_CLIENT_ID`, `SERPRO_CLIENT_SECRET`, `SERPRO_AUTHORIZED_CPF` | Consulta de CPF no Serpro | `consulta-cpf-serpro` |
| `LOVABLE_API_KEY` | Gateway de IA da Lovable | `ai-route-whatsapp` |

### WhatsApp worker

- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: acesso ao Supabase com a chave `service_role` (secreta, ignora o RLS).
- `WA_MASTER_KEY`: chave AES-256-GCM das sessões do WhatsApp, com exatamente 32 caracteres. Trocar a chave invalida as sessões já salvas.
- `LOG_LEVEL`: nível de log (opcional, padrão `info`). O logger lê esta variável antes de carregar `whatsapp-worker/.env`, então ela só vale se vier do ambiente do processo ou do `.env` da raiz do repositório.

O `docker-compose.yml` lê essas variáveis do ambiente do host (ou de um `.env` na raiz usado pelo Compose) e as repassa ao container.

## Usuário Master (Desenvolvimento)

Para criar um usuário master em ambiente de desenvolvimento, **não** use credenciais fixas no código.

Utilize o script de seed opcional localizado em `supabase/seeds/dev_seed_master_user.sql`.

1.  Abra o arquivo `supabase/seeds/dev_seed_master_user.sql`.
2.  Substitua os placeholders `SEU_EMAIL_AQUI` e `SUA_SENHA_AQUI` pelas credenciais desejadas.
3.  Execute o script no seu banco de dados (via SQL Editor do Supabase ou CLI).

**ATENÇÃO:** Em produção, crie o usuário master através do painel do Supabase Auth e insira manualmente o registro na tabela `usuarios_suporte` (ou `system_users`) com a role `master`.
