---
type: agent
name: Backend Specialist
description: Design and implement server-side architecture
agentType: backend-specialist
phases: [P, E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent for anything touching `server.ts`, the `api/` Vercel functions, or the `server/` and `src/services/` persistence layers — adding/changing REST routes, extending the Gemini OCR pipeline, or modifying how data is read/written against Supabase or the legacy JSON store.

## Responsibilities

- Add or modify Express routes in `server.ts` (and mirror OCR-related changes into `api/scan-receipt.ts` / `api/scan-fuel-receipt.ts` so the serverless and Express paths don't diverge)
- Extend `server/receiptAnalyzer.ts` (Gemini model fallback chain, prompt construction, response parsing)
- Add/modify CRUD functions in `src/services/supabaseService.ts`, keeping them in sync with the Supabase schema in `supabase/schema.sql` and migrations in `supabase/migrations/`
- Keep `server/db.ts` (legacy JSON store) and the Supabase path consistent in shape, or explicitly decide a feature is Supabase-only
- Update `src/shared/taxonomy.ts` when adding new categories/subcategories so both the OCR prompt and the UI see the same IDs

## Best Practices

- Never let a Supabase call throw uncaught — the existing pattern wraps calls in `try/catch` and falls back to the in-memory store (see `server.ts`'s shopping-list routes) or returns `success: false` with a Portuguese error message (see `analyzeReceiptImage`'s callers)
- Preserve the Gemini fallback cascade (`gemini-2.5-flash` → `gemini-3.8-flash` → `gemini-3.1-flash-lite`) and its `503`/`429` backoff when touching `receiptAnalyzer.ts`
- Keep response payloads consistent with what `src/types.ts` declares — update the type first, then the server
- Run `npm run lint` (`tsc --noEmit`) after any server change; there is no test suite to catch regressions otherwise

## Key Project Resources

- [README.md](../../README.md) — full REST endpoint catalog and setup instructions
- [../docs/architecture.md](../docs/architecture.md)
- [../docs/data-flow.md](../docs/data-flow.md)

## Repository Starting Points

- `server.ts` — all Express routes, voice webhooks, Vite middleware bootstrap
- `server/` — `db.ts` (legacy JSON schema), `supabase.ts` (server Supabase client), `receiptAnalyzer.ts` (Gemini OCR)
- `api/` — Vercel serverless duplicates of the OCR routes
- `src/services/` — client-callable CRUD against Supabase

## Key Files

- [server.ts](../../server.ts) — entry point and route table
- [server/receiptAnalyzer.ts](../../server/receiptAnalyzer.ts) — `analyzeReceiptImage`, `analyzeFuelReceiptImage`, `getGeminiClient`, `callGeminiVision`
- [server/db.ts](../../server/db.ts) — `DatabaseSchema`, `Database`, `generateInitialData`
- [src/services/supabaseService.ts](../../src/services/supabaseService.ts) — full CRUD surface (transactions, shopping list, fuel logs, goals, receipts)

## Architecture Context

- **Controllers** (`api/`, inline in `server.ts`) — no dedicated controller layer; routes are handlers defined directly on `app`
- **Services** (`src/services/`) — depends on Utils (`src/shared/taxonomy.ts`, `src/utils/`)
- **Utils** (`src/utils/`, `src/shared/`, `src/lib/`) — formatting, payer logic, Supabase client factory

## Key Symbols for This Agent

- `analyzeReceiptImage`, `analyzeFuelReceiptImage` — [server/receiptAnalyzer.ts:159,275](../../server/receiptAnalyzer.ts)
- `addTransactionToCloud`, `updateTransactionInCloud`, `deleteTransactionFromCloud` — [src/services/supabaseService.ts](../../src/services/supabaseService.ts)
- `fetchSupabaseData` — [src/services/supabaseService.ts:19](../../src/services/supabaseService.ts)
- `isSupabaseServerConfigured` — [server/supabase.ts](../../server/supabase.ts)
- `DatabaseSchema` — [server/db.ts:20](../../server/db.ts)

## Documentation Touchpoints

- [../docs/architecture.md](../docs/architecture.md) — dual-persistence design
- [../docs/data-flow.md](../docs/data-flow.md) — OCR and webhook pipelines
- [../docs/security.md](../docs/security.md) — lack of auth on `/api/*` routes

## Collaboration Checklist

1. Confirm whether the change needs to touch both the Supabase path and the legacy `server/db.ts` path, or is Supabase-only.
2. If modifying OCR, update both `server/receiptAnalyzer.ts` and the two `api/*.ts` serverless duplicates together.
3. Update `src/types.ts` first if the data shape changes, then propagate to services and routes.
4. Run `npm run lint` before considering the change done.
5. Manually exercise the affected route via the UI (`npm run dev`) since there is no automated test suite.

## Hand-off Notes

Flag any route added without authentication as a known limitation (see [../docs/security.md](../docs/security.md)) rather than treating it as an oversight to silently fix — the whole API is currently unauthenticated by design for this two-user household app.
