# Independent review request

Use it when your tool cannot spawn subagents.

Review request to give the person (fill the values):

> Review a CleanFlow change that is not committed yet. Read `AGENTS.md` first (the section "Working on a change" does not apply to you, you are only a reviewer), then `.agents/skills/cleanflow-quality-gate/SKILL.md`. Branch: `<branch>`, base: `origin/main`. Do not edit, commit, stash, fetch, checkout or create branches; only report. Run `git status` and `git diff origin/main` to see the changes, and read every new (untracked) file directly. Re-run the checks from `AGENTS.md` yourself (`npm run lint`, `npx vitest run`, `npm run build`, and `npx tsc -p tsconfig.app.json --noEmit` to compare the error count); never run `npm install`, and never run SQL against a real database. Planned phase: `<where / what / checks>`. Draft report: `<report>`. Answer in pt-BR, with file and line for each finding: (1) was everything in the phase done and nothing outside its scope changed; (2) does every claim in the report match the changes and the real command output; (3) is the change compliant with `AGENTS.md` and the relevant skills; (4) bugs and risks; (5) code quality (`cleanflow-quality-gate` section 7). End with APROVADO or REPROVADO and the list of findings.
