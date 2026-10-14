---
type: doc
name: architecture
description: System architecture, layers, patterns, and design decisions
category: architecture
generated: 2026-10-14
status: filled
scaffoldVersion: "2.0.0"
---

## Architecture Notes

Finanças Casal Duarte is a single Node.js/TypeScript app that serves a React 19 SPA and a small Express REST API from the same process (`server.ts`). It started as a Google AI Studio prototype backed by a local JSON file (`data/database.json` / `server/db.ts`) and is being migrated to Supabase (Postgres) as the system of record, so the codebase currently has two parallel persistence paths: the legacy in-memory/JSON store and the newer Supabase-backed services under `src/services/`. There is no separate backend deployment — in development Vite runs as Express middleware; in production the built SPA is served statically and two Vercel serverless functions (`api/scan-receipt.ts`, `api/scan-fuel-receipt.ts`) duplicate the OCR endpoints for platforms that don't run a long-lived Express process.

A third, fully independent entry point was added later: **`server/whatsapp/`** — a WhatsApp bot that lets the couple log expenses (text, voice note, or receipt photo) straight from an authorized WhatsApp group. It shares the Gemini analysis code (`server/receiptAnalyzer.ts`) and the Supabase project with the main app, but runs as its own long-lived Node process (`npm run whatsapp-bot`) on a separate always-on host, because it needs a persistent browser session that Vercel's serverless functions cannot provide. See the dedicated section below and [data-flow.md](data-flow.md).

## System Architecture Overview

- **Dev mode** (`npm run dev` → `tsx server.ts`): Express boots, attaches the Vite dev server as middleware (`createViteServer({ server: { middlewareMode: true } })`), and serves the SPA with HMR plus the `/api/*` routes from the same port (3000).
- **Production build** (`npm run build`): Vite builds the SPA to `dist/`, and `esbuild` bundles `server.ts` to `dist/server.cjs`. `npm start` runs that bundle, which serves static files from `dist/` and falls back to `index.html` for SPA routing.
- **Serverless fallback**: `api/scan-receipt.ts` and `api/scan-fuel-receipt.ts` re-implement the two Gemini OCR endpoints as standalone Vercel functions, calling the same shared logic in `server/receiptAnalyzer.ts` so the OCR behavior doesn't diverge between the Express server and the serverless deployment.
- **Data layer split**: `server/db.ts` holds the original JSON-seeded schema (`DatabaseSchema`, `Database` class) used for local/dev persistence and voice-assistant demo data in `server.ts`. `src/services/supabaseService.ts` and `src/lib/supabase.ts` / `server/supabase.ts` talk to Supabase directly from the client and from the server for the production data path (transactions, shopping list, fuel logs, goals, receipts). Front-end components call into `src/services/*` rather than hitting Supabase directly.

## Architectural Layers

- **Config**: root-level config (`vite.config.ts`, `tsconfig.json`, `.env`)
- **Controllers**: `api/` (Vercel functions) and route handlers inline in `server.ts`
- **Utils**: `src/utils/` (formatters, payer logic, image compression), `src/shared/taxonomy.ts` (category/subcategory taxonomy shared between client and OCR prompts), `src/lib/supabase.ts` (Supabase client factory)
- **Services**: `src/services/` — `supabaseService.ts` (CRUD against Supabase for transactions, shopping list, fuel logs, goals, receipts), `budgetCategoriesService.ts` (budget category + car-cost caching), `monthlySheetConfig.ts` (per-month closing-sheet config), `receiptNormalizer.ts` (merchant/brand normalization for OCR output) — depends on Utils
- **Components**: `src/components/` (~25 view/panel components: Dashboard, Transactions, Scanner, Goals, ShoppingList, SupermarketAnalytics, SpreadsheetImporter, VoiceIntegrations, etc.) — depends on Utils and Services

> Use `context({ action: "getMap", section: "all" })` for the generated architecture and dependency summary.

## Detected Design Patterns

| Pattern | Confidence | Locations | Description |
|---------|------------|-----------|-------------|
| Fallback-chain OCR client | high | `server/receiptAnalyzer.ts` (`getGeminiClient`, `callGeminiVision`) | Cascades through Gemini model variants on transient `503`/`429` errors before failing |
| Shared taxonomy module | high | `src/shared/taxonomy.ts` | Single source of truth for category/subcategory IDs, reused by both the React UI and the Gemini OCR prompt so classification stays consistent |
| Dual persistence (local JSON + Supabase) | medium | `server/db.ts` vs `src/services/supabaseService.ts` | Legacy seeded JSON store coexists with the Supabase-backed services during the migration |
| Fuzzy reconciliation engine | medium | `src/components/ShoppingListView.tsx` (`tokenize` and matching logic) | Matches OCR-extracted receipt items against pending shopping-list entries by token similarity |

## Entry Points

- [server.ts](../../server.ts) — Express server, REST routes, Vite middleware bootstrap
- [src/main.tsx](../../src/main.tsx) — React SPA entry point

## Public API

| Symbol | Type | Location |
|--------|------|----------|
| `analyzeReceiptImage` | function | `server/receiptAnalyzer.ts:159` |
| `analyzeFuelReceiptImage` | function | `server/receiptAnalyzer.ts:275` |
| `fetchSupabaseData` | function | `src/services/supabaseService.ts:19` |
| `addTransactionToCloud` / `updateTransactionInCloud` / `deleteTransactionFromCloud` | functions | `src/services/supabaseService.ts` |
| `addShoppingItemToCloud` / `toggleShoppingItemInCloud` / `batchToggleShoppingItemsInCloud` | functions | `src/services/supabaseService.ts` |
| `addFuelLogToCloud` / `updateFuelLogInCloud` / `deleteFuelLogFromCloud` | functions | `src/services/supabaseService.ts` |
| `buildTaxonomyPromptBlock` / `mapCategoryToId` / `mapSubcategoryToId` | functions | `src/shared/taxonomy.ts` |
| `formatBRL` / `parseBRL` / `formatDateBR` / `getCurrentMonthCode` | functions | `src/utils/formatters.ts` |
| `isCasalPayer` / `isConjointDebitPayment` / `isCreditCardPayment` | functions | `src/utils/payer.ts` |
| `DatabaseSchema` / `Database` | class/interface | `server/db.ts` |

## Top Directories Snapshot

- `src/` — 35 files (components, services, utils, shared, lib, types) — the bulk of the app
- `supabase/` — 4 files (schema, seed, migrations)
- `planilhas/` — 8 files (source `.xlsx` spreadsheets the app imports/replicates)
- `server/` — 3 files (db, supabase client, receipt analyzer)
- `api/` — 2 files (Vercel serverless OCR endpoints)
- `scripts/` — 2 files (Supabase connection/table verification scripts)
- `data/` — 2 files (legacy JSON database)
- `scratch/` — 2 files (scratch/experimental)

## Related Resources

- [project-overview.md](project-overview.md)
- [data-flow.md](data-flow.md)
