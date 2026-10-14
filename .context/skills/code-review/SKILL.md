---
type: skill
name: Code Review
description: Review code changes for correctness and consistency in this repo (no CI, no second reviewer, so this review step is the main quality gate)
skillSlug: code-review
phases: [R]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Run `npm run lint` (`tsc --noEmit`) — the only automated check available.
2. Confirm any `src/types.ts` change propagated to `src/services/supabaseService.ts` and, if relevant, `server/db.ts`.
3. Confirm new category/subcategory IDs were added to `src/shared/taxonomy.ts` consistently with any Gemini prompt text in `server/receiptAnalyzer.ts`.
4. Confirm new Express routes follow the existing `{ success, data|error }` response shape and fail soft on Supabase errors.
5. Confirm the author describes how they manually verified the change in the browser — there's no test suite to substitute for this.

## Examples

**Look for this anti-pattern (fix applied to only one persistence path):**
```ts
// supabaseService.ts updated, but server/db.ts's generateInitialData
// or equivalent local-store logic left stale — check both when a fix
// touches shared domain shapes like Transaction or ShoppingListItem.
```

## Quality Bar

- No new unauthenticated data exposure beyond what already exists (the whole API is unauthenticated by design — see `.context/docs/security.md`)
- No hardcoded secrets; only `dotenv`-loaded env vars
- Type changes are propagated everywhere they're consumed, not just at the call site that prompted the change

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
