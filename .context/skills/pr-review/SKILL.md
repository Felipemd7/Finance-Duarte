---
type: skill
name: PR Review
description: Review a set of changes before they land on main (this repo has no formal PR process — commits go straight to main)
skillSlug: pr-review
phases: [R]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Since this repo commits directly to `main` with no PR template or second reviewer, treat this skill as a final self-review pass before committing.
2. Run `npm run lint`.
3. Diff `git diff` against the type definitions in `src/types.ts` to confirm all consumers were updated.
4. Confirm the change was manually tested in the browser (`npm run dev`) — state how, since there's no CI log to point to instead.
5. Confirm the commit message matches the repo's `feat:`/`fix:` Portuguese convention (see the commit-message skill).

## Examples

**Self-review checklist applied to a typical change touching Supabase + UI:**
```
- [ ] npm run lint passes
- [ ] src/types.ts updated if shape changed
- [ ] src/services/supabaseService.ts mapping updated for any new/renamed column
- [ ] Manually tested the affected view in the browser
- [ ] Commit message follows `feat:`/`fix:` convention in Portuguese
```

## Quality Bar

- No commit should skip the manual browser check given the absence of automated tests
- No commit should introduce a new unauthenticated data exposure without it being an explicit, acknowledged trade-off

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
