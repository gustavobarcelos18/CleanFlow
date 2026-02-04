# Configuração de Ambiente

Este documento descreve as variáveis de ambiente necessárias para rodar o projeto e como configurar um usuário administrador em ambiente de desenvolvimento.

## Variáveis de Ambiente

O arquivo `.env` **NUNCA** deve ser versionado. Use o arquivo `.env.example` como modelo.

As variáveis necessárias são:

- `VITE_SUPABASE_PROJECT_ID`: ID do projeto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Chave pública (anon) do Supabase.
- `VITE_SUPABASE_URL`: URL da API do Supabase.

## Usuário Master (Desenvolvimento)

Para criar um usuário master em ambiente de desenvolvimento, **não** use credenciais fixas no código.

Utilize o script de seed opcional localizado em `supabase/seeds/dev_seed_master_user.sql`.

1.  Abra o arquivo `supabase/seeds/dev_seed_master_user.sql`.
2.  Substitua os placeholders `SEU_EMAIL_AQUI` e `SUA_SENHA_AQUI` pelas credenciais desejadas.
3.  Execute o script no seu banco de dados (via SQL Editor do Supabase ou CLI).

**ATENÇÃO:** Em produção, crie o usuário master através do painel do Supabase Auth e insira manualmente o registro na tabela `usuarios_suporte` (ou `system_users`) com a role `master`.
