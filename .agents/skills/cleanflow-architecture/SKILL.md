---
name: cleanflow-architecture
description: Use for CleanFlow architecture, project structure, dependencies, module boundaries, technical planning, or scope decisions. Enforces the approved stack and prevents feature creep.
---

# CleanFlow Architecture

## 1. Approved stack

The approved stack is the one in `AGENTS.md`. Do not replace it, and do not add a package, framework, state library or UI kit without the maintainer's decision (`AGENTS.md`, "Ask the maintainer first").

## 2. Where things live

| Path | What belongs there |
|---|---|
| `src/pages/` | One file per route screen; `pages/admin/` and `pages/support/` for the admin and support areas. Routes are declared (lazy-loaded) in `src/App.tsx`. |
| `src/components/<feature>/` | Components grouped by feature (`schedule`, `prontuario`, `financeiro`, `admin`, `onboarding`, `organization`, ...). `components/ui/` holds the shadcn/ui primitives. |
| `src/hooks/` | React hooks. `hooks/data/` has the React Query data hooks (see its `README.md`: `useAgenda*`, `useFinanceiro*`, `useWhatsApp*`). `hooks/governance/` for governance data. |
| `src/domain/<area>/` | Business logic with no React: `analytics`, `automations`, `billing`, `encaixe`, `whatsapp`. Put new pure rules here and test them (`__tests__/`). |
| `src/stores/` | Zustand stores, only for light global state (segment, sidebar, tour). |
| `src/lib/`, `src/utils/` | Small pure helpers (`cpf`, `phone`, `currency`, `scheduleConflicts`, `rbac`). |
| `src/integrations/supabase/` | The single Supabase client and the **generated** `types.ts`. Do not create another client and do not edit `types.ts` by hand. |
| `supabase/migrations/` | Versioned SQL schema and RLS. |
| `supabase/functions/` | Deno edge functions, one folder each; shared code in `_shared/` (`cors.ts`, `logger.ts`, `billing/`). |
| `whatsapp-worker/` | Separate Node service (Baileys) deployed with Docker. It has its own `package.json`. |
| `docs/` | Functional and setup documentation. |

## 3. Rules

- Remote data goes through React Query hooks that use the shared Supabase client, not ad-hoc `fetch` calls scattered in components.
- Validate user input with Zod and React Hook Form.
- Business rules that must be enforced belong in the database (RLS, constraints) or in an edge function. UI checks are only UX (`cleanflow-supabase-security`).
- Prefer extending an existing module over creating a new layer. Do not introduce a new folder level, service class or abstraction for a single use.
- Do not make large pages larger. Several files exceed 700 lines (`pages/Relatorios.tsx`, `pages/Agenda.tsx`, `pages/CaixaDiario.tsx`, `pages/admin/Reports.tsx`, `components/admin/AdminWhatsAppManagement.tsx`); extract only when the task is about that code, never as a side effect.
- Follow the design system in `.interface-design/system.md` for screens and components.

## 4. Scope

- Implement only what was requested. Ideas and backlog (`IDEIAS/`) are not approved scope.
- If a task seems to need a new dependency, a new service, or a change in how auth, billing or the WhatsApp channel work, stop and ask.
- If the repository contradicts the task (for example the task assumes a table or screen that does not exist), report the conflict instead of inventing it (`AGENTS.md` rule 13).
