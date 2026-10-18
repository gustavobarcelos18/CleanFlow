---
name: cleanflow-supabase-security
description: Use for CleanFlow authentication, roles, Row Level Security, tenant isolation, edge functions, secrets, CORS, webhooks, migrations, billing keys, LGPD and personal-data handling, or any security-sensitive change. The maintainer decides on changes to auth, roles, RLS and billing.
---

# CleanFlow Supabase and Security

CleanFlow is multi-tenant: many businesses share one Postgres database. A mistake here leaks one customer's data to another, so read this before touching auth, roles, policies, edge functions or secrets.

## 1. How access works today

- The browser uses the **publishable (anon) key** through the single client in `src/integrations/supabase/client.ts`. The session is persisted in `localStorage` by Supabase Auth.
- Route guards (`ProtectedRoute` in `src/App.tsx`, `RequireRole` and `RoleGuards`) and `hasRole` only decide what the UI shows. They are UX, not security.
- Real protection is **Row Level Security (RLS)** on the tables, using helpers such as `get_user_tenant_id(auth.uid())` and `user_has_role(...)` in the migrations, and the checks inside edge functions.
- Roles come from `profiles.role`, `user_unit_roles` and two platform tables (`system_users.system_role` and `usuarios_suporte.funcoes`, which RLS reads through `has_support_role`); see `AGENTS.md`, "Roles" and its known inconsistencies. Do not add another source and do not rename or merge roles without the maintainer.

## 2. Tables and RLS

- Every new table: `ENABLE ROW LEVEL SECURITY` in the same migration, and policies for each command that is allowed. No table is left without policies.
- Every tenant row carries `tenant_id` (or the organization/unit key used by neighbouring tables), and the policies compare it with the caller's tenant. Never write `USING (true)` for a tenant table in new or changed policies. Existing migrations already contain some `USING (true)`; do not rewrite them inside an unrelated task, report them to the maintainer.
- Admin or cross-tenant reads (platform support, `master`) must be explicit policies or edge functions; never loosen a tenant policy "to make it work".
- Index the columns that policies and joins use.
- Migrations follow `.agents/skills/cleanflow-contribution-workflow/references/migrations.md`. Never apply them to a real project yourself.

## 3. Edge functions (`supabase/functions/`)

- The `service_role` key bypasses RLS. Use it only inside edge functions, and only after the function has verified who the caller is and which tenant they belong to. When the function acts for a user, prefer a client built with the caller's JWT.
- Functions with `verify_jwt = false` in `supabase/config.toml` (webhooks and background jobs) must authenticate the caller another way: Stripe signature (`STRIPE_WEBHOOK_SECRET`), a shared secret, or the provider's verification. Changing `verify_jwt` needs the maintainer.
- CORS: in new or changed functions, use `_shared/cors.ts` and do not return `Access-Control-Allow-Origin: *` for authenticated endpoints. Many existing functions still use `*`; do not change them inside an unrelated task, report them to the maintainer.
- Do not log secrets or personal data; use `_shared/logger.ts` for structured logs.
- Never trust ids sent by the client (`tenant_id`, `user_id`, prices, credits). Derive them from the authenticated user or from the database.

## 4. Secrets

- Secrets live only in environment files that are not versioned (`.env*`, see `docs/CONFIGURACAO_AMBIENTE.md` and the three `.env.example` files) and in the Supabase secrets store.
- `VITE_*` variables are public: they are embedded in the browser bundle. Only the Supabase URL and the publishable key go there.
- Never paste a key, token, or password into code, docs, tests, issues, PR text or chat.
- If a secret is ever committed, say so immediately: it must be rotated, because removing the file does not remove it from git history.

## 5. Billing (Stripe)

Billing functions and plan/credit logic are maintainer decisions. Webhooks must verify the Stripe signature. Credits and prices are decided on the server, never taken from the request body. Test with Stripe test keys only.

## 6. WhatsApp

Two channels exist: the Meta Cloud API (edge functions, `WHATSAPP_ACCESS_TOKEN`) and the Baileys worker (`whatsapp-worker/`, session data encrypted with AES-256-GCM using `WA_MASTER_KEY`). Never log message bodies or phone numbers; never commit session data or the master key.

## 7. LGPD and personal data

- Collect the minimum. Do not add fields with personal or health data without a stated purpose.
- Prontuário, CPF, phone, address and appointment history are personal or sensitive data: access only by authorized roles of the same tenant, never in logs, never in URLs or query strings.
- The product has consent, retention and anonymization features (`ConsentManagement`, `AnonymizationManager`, `apply-retention-policies`). Do not bypass or weaken them.
- Export and deletion on demand (where applicable), and an audit trail for critical actions, are part of the product promise (`README.md`, "LGPD by design").
