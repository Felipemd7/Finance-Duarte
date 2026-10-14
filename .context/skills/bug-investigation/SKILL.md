---
type: skill
name: Bug Investigation
description: Systematically investigate and diagnose bugs. Use when a defect is reported in this app (OCR misclassification, dashboard totals mismatch, Supabase sync issues)
skillSlug: bug-investigation
phases: [E, V]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Reproduce the bug via `npm run dev` — there is no automated test suite, so manual reproduction is the only verification tool.
2. Identify which data path is involved: Supabase (`src/services/supabaseService.ts`) or the legacy JSON store (`server/db.ts`) — check both if unsure.
3. If the bug involves a receipt/OCR result, inspect `server/receiptAnalyzer.ts`'s prompt and parsing, then `src/services/receiptNormalizer.ts`'s merchant/brand normalization.
4. If the bug involves a wrong category or budget total, check `src/shared/taxonomy.ts` for an ID mismatch between what Gemini returned and what the UI expects.
5. Add a temporary `console.log`/`console.error` at the suspected boundary (there's no debugger/logging infra beyond this) and re-run.
6. Once isolated, write the minimal fix and re-run the original repro steps to confirm.

## Examples

**Typical mismatch to check first — row shape vs. TS type:**
```ts
// Supabase row uses snake_case; supabaseService.ts maps it to camelCase.
// A bug is often: a new column added to supabase/migrations/*.sql
// but the mapping function in supabaseService.ts wasn't updated.
const items = data.map((s: any) => ({
  id: s.id,
  estabelecimentoTipo: s.estabelecimento_tipo, // <- check this mapping exists for new fields
  ...
}));
```

## Quality Bar

- Don't guess — reproduce first, every time, since there's no test suite to lean on
- Check both persistence paths before declaring a fix complete
- Verify the fix against the exact original repro steps, not just "looks right"

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
