# Database migrations: one per pull request

Applies to every change in `supabase/migrations/`.

## Rules

1. File name: `YYYYMMDDHHMMSS_short_description.sql` (14-digit timestamp, snake_case). Older files with a shorter date prefix exist; do not copy that format and do not rename them.
2. Do not edit a migration that is already in `origin/main`; fix forward with a new migration. An exception needs the maintainer's decision (`AGENTS.md`, "Ask the maintainer first").
3. At most **one** new migration per pull request, so the order is easy to review. If a phase truly needs two, ask the maintainer.
4. Only versioned schema belongs in `supabase/migrations/`. Diagnostic or one-off scripts (`CHECKUP_*.sql`, data fixes run by hand) do not.
5. Every new table: `ENABLE ROW LEVEL SECURITY`, policies that isolate by `tenant_id` (or organization/unit), indexes for the columns used in policies and joins. See `cleanflow-supabase-security`.
6. Write migrations that can run once on a database that already has data: use `IF NOT EXISTS` where it is safe, give new `NOT NULL` columns a default or a backfill, and never drop a column or table in the same migration that stops using it.
7. After the schema changes, `src/integrations/supabase/types.ts` must be regenerated (never edited by hand). If you cannot run the generator, say so in the report.

## When another migration reaches `main` first

1. `git fetch origin` and compare `ls supabase/migrations` with your branch.
2. If your migration's timestamp is now older than one already in `main`, rename yours to a newer timestamp (only possible because yours is not merged yet) and re-check that it does not depend on the order.
3. Re-run the checks and update the pull request.

## What to tell the person

Say in plain Portuguese that the change touches the database, which tables are affected, and that it must be applied by the maintainer (`supabase db push` or the dashboard). Never apply a migration to a real project yourself.
