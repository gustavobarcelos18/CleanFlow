---
name: cleanflow-smart-dispatch
description: Use when delegating CleanFlow work to subagents or choosing a model. Routes tasks to opus, sonnet or haiku by complexity to save tokens without lowering quality on security, tenant isolation, billing or architecture work.
---

# CleanFlow Smart Dispatch

Pick the cheapest model that can do the task correctly. Set it with the `model` parameter when spawning a subagent. Do not spawn a subagent for work that is faster to do inline.

## opus — reasoning and risk

- Architecture decisions and scope/conflict analysis.
- Authentication, roles, RLS policies, tenant isolation, `verify_jwt` and secrets.
- Billing and payments (Stripe, credits, plans) and webhook handling.
- Migrations: schema design, constraints, indexes, data backfills.
- Business logic where several rules interact (scheduling conflicts, fit-in/encaixe, retention and anonymization).
- Final review before declaring a task complete, including the code quality review (`cleanflow-quality-gate` section 7) and reading the CI result of the PR.

## sonnet — standard implementation

- React pages and components with logic or data fetching; React Query hooks; Zustand stores.
- Edge functions without payment or authorization changes.
- Zod schemas and form validation.
- Debugging failing tests or builds; fixing TypeScript errors in typed domain code.

## haiku — mechanical tasks

- Text, labels and copy changes inside the approved UX.
- Unit tests for already-defined behavior.
- Searching files, listing usages, reading logs.
- Running lint/test/build commands and summarizing the output.

## Rules

- Security, authorization, tenant isolation and billing never go below sonnet, and the final review stays on opus.
- When unsure between two levels, pick the higher one.
- The task's scope is unchanged by the model chosen. Follow `AGENTS.md` and `cleanflow-quality-gate` regardless.
