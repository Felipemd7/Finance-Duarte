---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Project Overview

Finanças Casal Duarte is a shared household finance manager for a couple (Felipe & Camila Duarte), built to replace manually-maintained monthly Excel spreadsheets with an app that reads receipts with AI (Gemini Vision OCR), tracks budgets against planned vs. actual spend, manages a shared shopping list that reconciles against scanned receipts, and exposes voice-assistant integrations (Alexa, Siri) for hands-free expense logging and list management.

> **Semantic Snapshot**: Use `context({ action: "getMap", section: "all" })` for generated stack, architecture layers, key files, and dependency hotspots.

## Quick Facts

- Root: `D:\finanças-casal-duarte`
- Languages: TypeScript (primary), JavaScript (a few scripts)
- Entry points: `server.ts` (Express backend + Vite middleware), `src/main.tsx` (React SPA)
- Package manager: npm, no monorepo
- Semantic snapshot: `context({ action: "getMap", section: "all" })`

## Entry Points

- [server.ts](../../server.ts) — Express server: health check, Gemini OCR routes, shopping-list REST API, Alexa/Siri webhooks, Vite middleware bootstrap (dev) / static serving (prod)
- [src/main.tsx](../../src/main.tsx) — React 19 SPA bootstrap

## Key Exports

- OCR: `analyzeReceiptImage`, `analyzeFuelReceiptImage` (`server/receiptAnalyzer.ts`)
- Cloud data access: `addTransactionToCloud`, `fetchSupabaseData`, `addShoppingItemToCloud`, `addFuelLogToCloud`, and the rest of the CRUD surface in `src/services/supabaseService.ts`
- Shared taxonomy: `mapCategoryToId`, `mapSubcategoryToId`, `buildTaxonomyPromptBlock` (`src/shared/taxonomy.ts`)
- Formatting/domain helpers: `formatBRL`, `parseBRL`, `formatDateBR`, `isCasalPayer` (`src/utils/`)
- Domain types: `Transaction`, `Receipt`, `ShoppingListItem`, `FinancialGoal`, `SupermarketAnalytics` (`src/types.ts`)

## File Structure & Code Organization

- `src/components/` — ~25 React views/panels (Dashboard, Transactions, Scanner, Goals, ShoppingList, SupermarketAnalytics, SpreadsheetImporter, VoiceIntegrations, etc.)
- `src/services/` — Supabase-backed CRUD and config services
- `src/utils/` / `src/shared/` / `src/lib/` — formatters, payer logic, taxonomy, Supabase client
- `server/` — Express-side logic: local JSON DB (`db.ts`), Supabase server client, Gemini receipt analyzer
- `api/` — Vercel serverless equivalents of the two OCR endpoints
- `supabase/` — SQL schema, seed data, and migrations
- `planilhas/` — the couple's original monthly Excel spreadsheets that the importer targets
- `scripts/` — ad hoc Supabase connectivity/table-verification scripts
- `data/` — legacy JSON database file used before/alongside Supabase

## Technology Stack Summary

Frontend: React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS v4, Recharts for charts, Motion for transitions, PapaParse/xlsx for spreadsheet parsing. Backend: Node.js + Express 4, run via `tsx` in dev and bundled with `esbuild` for production. No test framework or linter beyond `tsc --noEmit` is configured.

## Core Framework Stack

React 19 with function components and hooks throughout `src/components/`; no router (the app is state-driven from `src/App.tsx`, likely view-switching rather than URL-based routing, given the "Views" naming convention). Express handles both REST API routes and (in dev) Vite's middleware-mode dev server for HMR.

## UI & Interaction Libraries

Tailwind CSS v4 (via `@tailwindcss/vite`) for styling, `lucide-react` for icons, `recharts` for dashboard/analytics charts, `motion` for animated transitions — all oriented toward a mobile-friendly, Portuguese-language UI (see `MobileNavigation.tsx`, `BottomNav.tsx`).

## Development Tools Overview

`tsx` runs the TypeScript server directly in dev without a separate compile step; `esbuild` produces the production server bundle; `vite` builds the SPA. See [tooling.md](tooling.md) for the full script reference.

## Getting Started Checklist

1. Install dependencies: `npm install`.
2. Create `.env` with `GEMINI_API_KEY` and Supabase credentials.
3. Start the dev server: `npm run dev`, then open `http://localhost:3000`.
4. Review [README.md](../../README.md) for the full feature/API catalog, then [architecture.md](architecture.md) and [data-flow.md](data-flow.md) for how OCR, Supabase, and voice webhooks fit together.

## Next Steps

The project is mid-migration from a local JSON database (`server/db.ts`, seeded for Jan–Aug 2026) to Supabase as the system of record — new feature work should prefer the Supabase-backed services in `src/services/` over extending `server/db.ts`.
