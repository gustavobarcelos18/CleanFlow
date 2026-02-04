# Setup do Banco de Dados Supabase

Este projeto utiliza o sistema de migrations do Supabase para gerenciar o esquema do banco de dados.

## Provisionamento Oficial

Para configurar o banco de dados do zero (em desenvolvimento), utilize o comando:

```bash
npx supabase db reset
```

Este comando irá:
1.  Resetar o banco de dados local.
2.  Aplicar todas as migrations localizadas em `supabase/migrations`.
3.  Aplicar o seed padrão (se houver).

## Usuário Master

Após provisionar o banco, você precisará criar um usuário master para acessar o painel administrativo.
Consulte `docs/CONFIGURACAO_AMBIENTE.md` para instruções sobre como rodar o seed opcional de usuário master.

## Arquivo `clinflow_database_complete.sql`

O arquivo `clinflow_database_complete.sql` é mantido apenas como uma **referência histórica** ou um snapshot completo do esquema em um determinado momento (v2.0).

**NÃO** utilize este arquivo para provisionar o banco de dados em produção ou desenvolvimento, pois ele pode estar desatualizado em relação às migrations mais recentes. Sempre confie na pasta `supabase/migrations` como a fonte da verdade.
