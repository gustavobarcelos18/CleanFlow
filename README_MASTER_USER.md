# Master User Guide

## Access Configuration

To configure a master user, please refer to `docs/CONFIGURACAO_AMBIENTE.md`.

Do **NOT** commit credentials to this repository.

## Roles & Access
The master user will have:
1.  **Tenant Admin**: Full administrative access.
2.  **Professional**: Can be selected as a professional.
3.  **Patient**: Linked to the user account.

## Deployment Required
To ensure the "Create Professional" feature works securely without logging you out, please deploy the new Edge Function:

```bash
npx supabase functions deploy create-user --no-verify-jwt
```
