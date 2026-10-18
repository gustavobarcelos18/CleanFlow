# CleanFlow — Repository Agent Guide

CleanFlow (also written ClinFlow in some files and documents) is a multi-tenant micro-SaaS for scheduling and operating businesses that sell time: clinics, aesthetics and wellness, salons and barbershops, workshops.

Read this whole file before changing anything. It applies to every AI tool and to every contributor, including people who do not know web development.

## Product purpose

Centralize the agenda, service delivery, client communication and daily operations of a business in one system, to reduce no-shows and give predictability to the day.

Main areas (details in `README.md`): agenda with several professionals, waiting list, client communication trail (WhatsApp, reminders), cash and financial reports, multi-unit organizations with consolidated view, RBAC, LGPD by design.

## Approved stack

### Frontend (`src/`)
- Vite 5, React 18, TypeScript 5, React Router DOM 6
- Tailwind CSS 3 with `tailwindcss-animate`; shadcn/ui components on Radix UI; `lucide-react` icons; `next-themes` for light/dark
- TanStack React Query v5 for remote data; Zustand for light global state
- React Hook Form + Zod for forms and validation
- Recharts, Sonner, cmdk, dnd-kit, react-joyride, date-fns, jsPDF (+ autotable)
- Design system: `.interface-design/system.md` ("Bold & Clarity")

### Backend and integrations
- Supabase: Auth, Postgres with Row Level Security, Edge Functions (Deno) in `supabase/functions/`, SQL migrations in `supabase/migrations/`
- Stripe for billing; WhatsApp Cloud API (Meta) and an own WhatsApp worker (`whatsapp-worker/`, Node, Docker)
- Deploy of the frontend on Vercel (`vercel.json`)

### Quality tooling
- ESLint 9 (typescript-eslint), Vitest 4 with Testing Library and jsdom
- Package manager: **npm** (`package-lock.json`). Do not add other lockfiles to the app or to `whatsapp-worker/`.

## Roles

Access control has three independent layers. This is how the code works today; it is **not** an approved target model (see "Known inconsistencies").

1. **Profile role** (`profiles.role`, enum `user_role`): `admin`, `profissional`, `recepcao`, `paciente`, `manager`, `professional`, `receptionist`.
2. **Organization and unit roles** (multi-unit, enum `org_role`): `org_admin`, `org_finance`, `unit_admin`, `unit_finance`, `atendimento`, `leitura`. The frontend reads them from `user_unit_roles`.
3. **Platform (support) roles**, stored in two places:
   - `system_users.system_role` (enum `system_role`): `master`, `support`, `client`, `support_basic`, `support_intermediate`. This is what `useUserRoles` reads; `master` passes every frontend role check.
   - `usuarios_suporte.funcoes` (enum `support_role`): `master`, `admin`, `agente`, `financeiro`, `leitura`. This is what the database helper `has_support_role` (used by RLS policies) and the support admin screens (for example `EditSupportUserDialog`) use.

The frontend maps them to `AppRole` (`src/hooks/useUserRoles.tsx`, with `ROLE_ALIASES`) and guards routes with `RequireRole` / `RoleGuards` (`src/components/auth/RequireRole.tsx`).

Known inconsistencies (do not "fix" them inside an unrelated task; ask the maintainer):
- `user_role` has duplicate meanings in Portuguese and English (`profissional`/`professional`, `recepcao`/`receptionist`).
- `src/utils/rbac.ts` defines a separate role/permission map (`admin`, `manager`, `professional`, `receptionist`, `patient`).
- Platform roles live in two tables with two different enums. `ROLE_ALIASES.suporte` lists `master`, `admin`, `agente`, but the frontend only loads `system_users.system_role`, so in practice only `master` matches.
- Of the profile roles, only `admin` maps to an `AppRole` (`admin_tenant`); `profissional`, `recepcao`, `paciente`, `manager` and the English twins map to none.
- The generated `types.ts` has `unit_roles`, while the frontend queries `user_unit_roles` through `as any`, so the types are not in sync for that table.

## Global engineering rules

1. Implement only the requested scope.
2. Do not introduce unrequested features, packages, frameworks, layers, or abstractions.
3. Preserve approved architecture unless the task explicitly changes it.
4. Do not edit unrelated files.
5. Never trust frontend-only authorization or business-rule enforcement. `RequireRole` and `hasRole` are UX; the real barrier is Row Level Security and the edge functions.
6. Every tenant table must have RLS enabled and isolate rows by `tenant_id` (or the organization/unit equivalent). Never add a policy that opens data across tenants.
7. Never use the `service_role` key, or any secret, in the frontend or in a `VITE_*` variable.
8. Do not edit `src/integrations/supabase/types.ts` by hand; it is generated from the database.
9. Collect the minimum personal data (LGPD). Do not log personal or health data (CPF, prontuário, phone numbers, message bodies).
10. Prefer simple, readable code over speculative extensibility.
11. Do not replace approved technologies.
12. Run the relevant quality checks before declaring a task complete.
13. If repository behavior conflicts with a task prompt, report the conflict before making broad architectural changes.
14. Do not rewrite existing working code merely for style.
15. Do not add `any`, `@ts-ignore`, `eslint-disable` or `console.log` in new code.
16. Whenever there is any doubt, ask the user and wait for the answer. Never infer, assume or deduce missing requirements, behavior, scope or decisions.
17. Always answer and ask the user questions in Brazilian Portuguese (pt-BR).

## Who you are helping

The person you assist may not know web development and may not be able to review code. Because of that:

- Explain what you changed and why in plain Brazilian Portuguese, without unexplained jargon.
- List every file you created, edited or deleted.
- Warn clearly when a change is risky (security, login, data, deletion, database, billing).
- Do only what was asked. If the request is vague, or would touch more than it names, ask first (rule 16).
- Never say a check passed unless you ran it and saw it pass. If you could not run it, say so.

## Never do (nobody can approve these)

- Push to `main`, force-push, or merge a pull request. Only the maintainer merges.
- Commit secrets: `.env` files, tokens, passwords, signing keys, `service_role`/Stripe/WhatsApp keys, or real personal data of clients or patients.
- Delete, skip or disable tests, loosen lint rules, or remove CI steps, to make a check pass. Fix the cause instead.
- Run destructive SQL (drop, truncate, delete without filter) against a real database.
- Open, quote or copy the contents of `Stripe.txt` and `ADMIN_SETUP.md`, if they still exist: they hold credentials and are pending removal by the maintainer.

## Ask the maintainer first

The maintainer is the project owner. These changes need the maintainer's decision, not only the agreement of the person you are helping. Unless the conversation states the person is the maintainer, do not do them; do the rest of the task and tell the person to ask the maintainer about that part.

- Add, remove or upgrade a package or dependency (`package.json`, `package-lock.json`, `whatsapp-worker/package.json`, `whatsapp-worker/package-lock.json`).
- Edit a SQL migration that is already in `origin/main`. Normally never do it: schema changes go in a new migration (`cleanflow-contribution-workflow`, `references/migrations.md`).
- Change authentication, authorization, roles, RLS policies, or `verify_jwt` in `supabase/config.toml`.
- Change billing or payments (Stripe functions, plans, credits).
- Change `.github/` (CI) or deployment configuration (`docker-compose.yml`, `vercel.json`, `whatsapp-worker/Dockerfile`).

## Working on a change

1. Run `git status`. If there are uncommitted changes you did not make for this task, stop and ask.
2. Run `git fetch origin` and create a new branch from `origin/main`. Never work directly on `main`.
3. Name the branch `<type>/<short-description>`, where type is `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore` or `ci` (example: `feat/waiting-list-filters`).
4. Commit only when the person asks. Commit messages follow Conventional Commits (`feat: ...`, `fix: ...`).
5. When the person asks you to publish the work, push the branch (never `main`) and open a pull request to `main`.
6. In the pull request, state what changed and why, which files, and which checks you ran with their real results.

Collaborators follow the complete process: `cleanflow-phased-delivery`, `cleanflow-quality-gate` and `cleanflow-project-brain`.

## Checks before saying a task is done

Follow `cleanflow-quality-gate`, and run what applies to the files you changed, reporting the real result:

- `npm ci` first (not `npm install`, which can rewrite the lockfile), then:
- `npm run lint`. It currently reports 1 error and 38 warnings on `main`: the error is in a third-party skill file (`.agents/skills/ui-ux-design-pro/cli/lib/generators.ts`), which is outside any task's scope. Your change must add no new error or warning (compare with `npx eslint src`, which must stay at 0 errors).
- `npx vitest run`
- `npm run build`
- Type check: `npx tsc -p tsconfig.app.json --noEmit`. The project still has a known backlog of type errors, so it is not a gate yet: do not increase the count, and report the number before and after.
- Edge functions or SQL: say clearly what you could not run locally (Deno, Supabase CLI) instead of claiming it works.

## Repository skills

Use the smallest relevant set of skills under `.agents/skills/`. If your tool does not load skills automatically, open `.agents/skills/<name>/SKILL.md` yourself before starting. Before any change, read `cleanflow-contribution-workflow`.

| Task | Read |
| --- | --- |
| Folder structure, scope or boundary doubt, new dependency | `cleanflow-architecture` |
| Login, roles, RLS, edge functions, secrets, migrations, LGPD | `cleanflow-supabase-security` (maintainer decides, see above) |
| Business rule or "what is allowed" question | `cleanflow-domain-rules` |
| New or changed screen or component | `.interface-design/system.md` and `.agents/skills/ui-ux-design-pro` |
| Any task before saying it is done | `cleanflow-quality-gate` |
| Phased plan, phase report, resume after context reset | `cleanflow-phased-delivery` + `cleanflow-project-brain` |
| Branch, commit, migration order, pull request | `cleanflow-contribution-workflow` |
| Delegating work to subagents | `cleanflow-smart-dispatch` |
