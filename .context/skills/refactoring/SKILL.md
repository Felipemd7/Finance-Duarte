---
type: skill
name: Refactoring
description: Restructure code in this repo without changing behavior
skillSlug: refactoring
phases: [E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Identify the smallest behavior-preserving change — e.g. extracting repeated currency formatting into `src/utils/formatters.ts`, or splitting a large view component.
2. Before refactoring, note the current behavior by manually exercising the affected view/route (no test suite to snapshot against).
3. Make the structural change without altering inputs/outputs.
4. Re-run `npm run lint` and manually re-verify the exact same behavior.

## Examples

**Good refactor candidate (duplication across components):**
```ts
// Instead of each component formatting currency inline:
`R$ ${value.toFixed(2).replace('.', ',')}`
// ...use the existing helper:
import { formatBRL } from '../utils/formatters';
formatBRL(value)
```

## Quality Bar

- Never bundle a refactor with a behavior change in the same commit
- Don't refactor across the Supabase/legacy-JSON boundary as a side effect — that's an architectural call, not a refactor
- Verify manually before and after since there's no automated regression safety net

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
