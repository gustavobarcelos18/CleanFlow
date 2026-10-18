---
name: cleanflow-quality-gate
description: Use before declaring any CleanFlow coding task complete. Verifies scope, lint, tests, build, type errors, migrations, tenant isolation and security-sensitive behavior, and that unrelated files were not changed.
---

# CleanFlow Quality Gate

Use this skill at the end of every implementation task.

## 1. Scope review

- Inspect `git diff` / changed files.
- Confirm every changed file is necessary for the requested task.
- Revert unrelated formatting/refactors.
- Confirm no unrequested feature or dependency was added.

## 2. Frontend validation

Use the repository's package manager (npm) and its scripts; do not invent commands.

- `npm ci` once, then:
- `npm run lint`: it currently reports 1 error (third-party skill file `.agents/skills/ui-ux-design-pro/cli/lib/generators.ts`) and 38 warnings on `main`. Your change must add no new error or warning; `npx eslint src` must stay at 0 errors.
- `npx vitest run`: all tests pass. (`npm test` starts watch mode; do not use it for checks.)
- `npm run build`: succeeds.
- `npx tsc -p tsconfig.app.json --noEmit`: the project still carries a backlog of type errors, so this is not a pass/fail gate yet. Report the count before and after your change; it must not go up. When the count reaches 0 the gate becomes pass/fail.

When `whatsapp-worker/` changed, run `npm ci` and `npm run build` from that folder. Its `lint` and `test` scripts point to `eslint` and `vitest`, which are not installed there, and it has no tests, so they fail today: report that, and do not install anything (adding a dependency is the maintainer's decision).

## 3. Database and edge functions

When SQL or `supabase/functions/` changed:

- follow `.agents/skills/cleanflow-contribution-workflow/references/migrations.md`;
- check the RLS and tenant-isolation rules of `cleanflow-supabase-security`;
- Deno and the Supabase CLI may not be installed: say exactly what you could and could not run. Never claim an edge function or migration works if you did not run it.

## 4. Business-rule validation

For affected behavior, explicitly verify the cases that matter, using `cleanflow-domain-rules`. Examples: a user of tenant A never sees data of tenant B; a role without permission is denied by RLS and not only hidden in the UI.

## 5. Security review

For auth, roles, RLS, secrets, billing, files and personal-data changes:

- no secrets committed (`.env*`, `service_role`, Stripe, WhatsApp, Serpro keys);
- no `service_role` or secret reachable from the frontend or a `VITE_*` variable;
- no authorization enforced only in the UI;
- no personal or health data (CPF, prontuário, phone, message bodies) written to logs;
- webhook-style edge functions (`verify_jwt = false`) validate their caller (signature or shared secret).

## 6. Completion report

Report:
- what changed;
- files/modules affected;
- commands/checks run;
- test/build result and the type-error count before and after;
- migrations added, if any;
- any unresolved issue.

Do not claim success for checks that were not actually run.

When executing a phased plan, this report is the basis of the phase completion report. Approval, commit and push rules are in `cleanflow-phased-delivery`.

## 7. Code quality review (before the PR)

The reviewer applies these criteria by hand to the **lines added or changed by the phase** (the diff), not to the legacy code around them. Report every finding with file and line; all of them must be fixed. Legacy problems in untouched lines (the backlog of `any`, `console.log`, oversized pages) are only reported as observations, never fixed as a side effect (`AGENTS.md` rules 1, 4 and 14).

- cognitive complexity and deep nesting; functions or components that are too long or take too many parameters (several pages already exceed 700 lines: do not make them longer);
- duplicated code and duplicated string literals;
- dead code: unused variables, imports, parameters, unreachable branches, commented-out code;
- empty or swallowed catch blocks, ignored return values, floating promises;
- TypeScript/React: `any`, non-null assertions without need, array index as `key`, missing hook dependencies, nested ternaries, leftover `console.log`;
- hardcoded credentials, URLs or secrets; unsafe patterns (for example `dangerouslySetInnerHTML` with user data, string-built SQL).

Do not "fix" findings by suppressing them (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`) without asking the user.

## 8. CI verification (after push, on the PR)

If the repository has `.github/workflows/`, wait until the checks of the PR finish and read their real result with `gh pr checks <N>`. Fix every failure on the phase branch, run the checks again, push, and read again. Report the outcome in the phase report. Never claim the PR is green without having read the result. If a check cannot be fixed within the phase scope, ask the user.
