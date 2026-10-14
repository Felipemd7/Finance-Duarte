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
- **Repositories**: `server/whatsapp/receiptsRepository.ts` / `approveReceipt.ts` — server-side (service-role) Supabase writes for the WhatsApp bot, mirroring the browser-side functions in `supabaseService.ts` since the bot never runs in a browser
- **Components**: `src/components/` (~25 view/panel components: Dashboard, Transactions, Scanner, Goals, ShoppingList, SupermarketAnalytics, SpreadsheetImporter, VoiceIntegrations, etc.) — depends on Utils and Services
- **WhatsApp bot** (`server/whatsapp/`): its own self-contained subsystem — see dedicated section below

> Use `context({ action: "getMap", section: "all" })` for the generated architecture and dependency summary.

## WhatsApp Bot Subsystem (`server/whatsapp/`)

A standalone Node process (`npm run whatsapp-bot` → `server/whatsapp/bot.ts`) that connects one WhatsApp account via [whatsapp-web.js](https://github.com/wwebjs/whatsapp-web.js) and lets the couple log expenses by sending text, a voice note, or a receipt photo into **one authorized WhatsApp group** (`WHATSAPP_GROUP_ID`). It never touches `server.ts`, the Vite build, or the Vercel deployment — the only thing it shares with the main app is the Gemini analysis code and the Supabase database.

- **`client.ts`** — wraps `whatsapp-web.js`'s `Client`/`LocalAuth` (session persisted in `./tokens/`, gitignored). Includes a watchdog: if `ready` never fires after `authenticated` within 120s (a known upstream bug, wwebjs#201946/#201919), it destroys and restarts the client automatically, up to 4 times.
- **`wwebjsPatch.ts`** — a runtime monkey-patch applied *before* `whatsapp-web.js` is imported, retrying `page.exposeFunction` on the transient Puppeteer errors that trigger the bug above. Removable once the upstream fix ships.
- **`qrState.ts` / `qrServer.ts`** — a tiny Express server (separate port, `WHATSAPP_QR_PORT`, default 3101) that renders the current QR code and connection status as a web page, since ASCII QR codes don't render reliably in Windows terminals.
- **`bot.ts`** — entry point: filters to the authorized group only, serializes message handling per chat (so two expenses arriving close together never race), and dispatches each message to `expenseIngest.ts`.
- **`expenseIngest.ts`** — the core pipeline: classifies the message (image/audio/text), calls the right `receiptAnalyzer.ts` function, asks a follow-up question in the group when something important is missing (value, location, liters, odometer), applies learned knowledge (`knowledge.ts`) and sanity checks (`guards.ts`), saves a draft receipt, and replies with a confirmation the person can approve with "sim"/"não" (auto-approved after 10 minutes if nobody answers).
- **`pendingConfirmations.ts` / `pendingQuestions.ts`** — in-memory (confirmations also persisted to `tokens/pending-confirmations.json`) per-chat state machines for the "sim/não" and "what's missing?" conversational loops.
- **`knowledge.ts`** — loads the last 90 days of `transactions`/`establishments`/`fuel_logs` from Supabase (30-minute cache) to canonicalize merchant names, infer the right subcategory, and suggest a likely establishment for generic card-machine receipts.
- **`guards.ts` / `normalize.ts`** — sanity checks (duplicate detection, odometer regressions, outlier amounts) and small pure helpers (pt-BR number/date parsing, payment-method canonicalization, fuzzy name matching).
- **`approveReceipt.ts` / `receiptsRepository.ts`** — the server-side (service-role) equivalents of `src/services/supabaseService.ts`'s draft-save and approval functions.

See [data-flow.md](data-flow.md) for the full message-to-transaction flow and [glossary.md](glossary.md) for the domain terms (pending confirmation, pending question, learned knowledge, etc.).

## Detected Design Patterns

| Pattern | Confidence | Locations | Description |
|---------|------------|-----------|-------------|
| Fallback-chain OCR client | high | `server/receiptAnalyzer.ts` (`getGeminiClient`, `callGeminiVision`) | Cascades through Gemini model variants on transient `503`/`429` errors before failing |
| Shared taxonomy module | high | `src/shared/taxonomy.ts` | Single source of truth for category/subcategory IDs, reused by both the React UI and the Gemini OCR prompt so classification stays consistent |
| Dual persistence (local JSON + Supabase) | medium | `server/db.ts` vs `src/services/supabaseService.ts` | Legacy seeded JSON store coexists with the Supabase-backed services during the migration |
| Fuzzy reconciliation engine | medium | `src/components/ShoppingListView.tsx` (`tokenize` and matching logic) | Matches OCR-extracted receipt items against pending shopping-list entries by token similarity |
| Model-chain fallback with quota/backoff awareness | high | `server/receiptAnalyzer.ts` (`callGeminiMultimodal`, `modelChain`) | Walks a configurable list of Gemini models (fastest/cheapest first), distinguishing quota (429, skip model until reset) from transient overload (503/timeout, retry) from hard failures |
| Conversational state machine (pending question / pending confirmation) | high | `server/whatsapp/pendingQuestions.ts`, `pendingConfirmations.ts` | Per-chat in-memory state that turns a single WhatsApp message into a multi-turn "what's missing? / do you confirm?" exchange with a 10-minute timeout and auto-resolution |
| Runtime monkey-patch for a third-party library bug | medium | `server/whatsapp/wwebjsPatch.ts` | Patches `whatsapp-web.js` internals before import to work around an unfixed upstream bug, rather than forking/vendoring the dependency |

## Entry Points

- [server.ts](../../server.ts) — Express server, REST routes, Vite middleware bootstrap
- [src/main.tsx](../../src/main.tsx) — React SPA entry point
- [server/whatsapp/bot.ts](../../server/whatsapp/bot.ts) — WhatsApp bot process (`npm run whatsapp-bot`), fully independent of the above two

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
- `server/` — 17 files: `db.ts`/`supabase.ts`/`receiptAnalyzer.ts` at the root, plus the `whatsapp/` bot subsystem (client, bot, expenseIngest, knowledge, guards, normalize, pending* state, approveReceipt, receiptsRepository, qrServer/qrState, ownMessages, wwebjsPatch)
- `supabase/` — 4 files (schema, seed, migrations)
- `planilhas/` — 8 files (source `.xlsx` spreadsheets the app imports/replicates)
- `api/` — 2 files (Vercel serverless OCR endpoints)
- `scripts/` — 2 files (Supabase connection/table verification scripts)
- `data/` — 2 files (legacy JSON database)
- `tokens/` — WhatsApp bot session (`whatsapp-web.js` LocalAuth) + persisted pending confirmations; gitignored, not an app directory
- `scratch/` — scratch/experimental (throwaway verification scripts; never committed)

## Related Resources

- [project-overview.md](project-overview.md)
- [data-flow.md](data-flow.md)
