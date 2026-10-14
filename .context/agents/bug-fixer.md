---
type: agent
name: Bug Fixer
description: Diagnose and resolve defects
agentType: bug-fixer
phases: [E, V]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent when a reported issue needs root-cause diagnosis and a targeted fix — e.g. a miscategorized OCR'd receipt, a dashboard total that doesn't match the spreadsheet, or a Supabase sync discrepancy (several recent commits in this repo are exactly this kind of fix, e.g. "correcao de duplicacao de fuel_logs no scanner").

## Responsibilities

- Reproduce the bug locally via `npm run dev` before changing code
- Trace the data path: UI component → `src/services/*` → Supabase (or `server/db.ts` fallback) — most bugs in this app live at that boundary (field-name mismatches, missing null checks, double-writes)
- For OCR-related bugs, check `server/receiptAnalyzer.ts`'s prompt/parsing and `src/services/receiptNormalizer.ts`'s merchant normalization before assuming the model is wrong
- For category/budget bugs, check `src/shared/taxonomy.ts` for ID mismatches between OCR output and UI expectations

## Best Practices

- Since there's no test suite, write a minimal manual repro script or steps and verify the fix against it before and after
- Check whether the bug exists in only one of the two persistence paths (Supabase vs. legacy `server/db.ts`) or both
- Run `npm run lint` after the fix to make sure the change didn't introduce a type error elsewhere

## Key Project Resources

- [../docs/data-flow.md](../docs/data-flow.md)
- [../docs/testing-strategy.md](../docs/testing-strategy.md) — no automated tests, manual verification only

## Repository Starting Points

- `src/services/` — most data-consistency bugs trace back here
- `server/receiptAnalyzer.ts`, `src/services/receiptNormalizer.ts` — OCR classification/normalization bugs
- `src/shared/taxonomy.ts` — category/subcategory ID mismatches

## Key Files

- [src/services/supabaseService.ts](../../src/services/supabaseService.ts)
- [server/receiptAnalyzer.ts](../../server/receiptAnalyzer.ts)
- [src/services/receiptNormalizer.ts](../../src/services/receiptNormalizer.ts)
- [src/shared/taxonomy.ts](../../src/shared/taxonomy.ts)

## Architecture Context

- **Services** depend on **Utils**; most defects cross that boundary via inconsistent field naming (snake_case Supabase rows vs camelCase TS types)

## Key Symbols for This Agent

- `sanitizeDisplayName`, `normalizeFuelType`, `precoL` — [src/services/supabaseService.ts](../../src/services/supabaseService.ts)
- `mapCategoryToId`, `mapSubcategoryToId`, `norm` — [src/shared/taxonomy.ts](../../src/shared/taxonomy.ts)
- `isCardTerminalBrand`, `NormalizedReceiptOutput` — [src/services/receiptNormalizer.ts](../../src/services/receiptNormalizer.ts)

## Documentation Touchpoints

- [../docs/data-flow.md](../docs/data-flow.md)
- [../docs/glossary.md](../docs/glossary.md)

## Collaboration Checklist

1. Reproduce the bug via the running app, not just by reading code.
2. Identify which persistence path(s) are affected.
3. Apply the minimal fix; avoid unrelated refactors in the same change.
4. Run `npm run lint`.
5. Re-verify the original repro steps now pass.

## Hand-off Notes

Recent commit history shows this app tends to accumulate subtle duplication/sync bugs between the Supabase path and the UI's optimistic local state (e.g. fuel log duplication) — when fixing one, check `src/components/FuelManagementSection.tsx` and similar components for matching optimistic-update logic that could double-apply.
