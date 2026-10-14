---
type: doc
name: testing-strategy
description: Test frameworks, patterns, coverage requirements, and quality gates
category: testing
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Testing Strategy

There is currently no automated test suite in this repository — no test framework is installed, and no `*.test.ts`/`*.spec.ts` files exist. Quality is currently maintained only through TypeScript's static type checking and manual verification in the browser against `npm run dev`.

## Test Types

- **Unit**: none configured. If introduced, TypeScript + Vite's ecosystem suggests Vitest as the natural fit (co-located `*.test.ts` files) given the existing `vite.config.ts`.
- **Integration**: none configured. The two meaningful integration seams worth testing first would be `server/receiptAnalyzer.ts` (Gemini fallback chain and JSON parsing) and `src/services/supabaseService.ts` (CRUD against a Supabase test project).
- **E2E**: none configured. The two scripts in `scripts/` (`test_supabase_connection.js`, `verify_supabase_tables.js`) are the closest thing to integration checks today, but they're manual connectivity probes, not assertions run in CI.

## Running Tests

- Type-check (the only automated quality check today): `npm run lint` (runs `tsc --noEmit`)
- Manual Supabase connectivity check: `node scripts/test_supabase_connection.js`
- Manual Supabase schema/table check: `node scripts/verify_supabase_tables.js`

## Quality Gates

The only enforced gate before considering a change complete is a clean `npm run lint` (TypeScript compile with no emit). There is no coverage requirement, no CI pipeline, and no pre-commit hook configured in this repository.

## Troubleshooting

If `npm run lint` reports errors in `server/db.ts` or `src/services/supabaseService.ts` after a schema change, check that `src/types.ts` and the Supabase SQL migrations in `supabase/migrations/` agree on field names — the dual local-JSON/Supabase persistence paths are the most common source of type drift.
