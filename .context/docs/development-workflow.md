---
type: doc
name: development-workflow
description: Day-to-day engineering processes, branching, and contribution guidelines
category: workflow
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Development Workflow

This is a single-developer/couple project (Felipe & Camila Duarte) without a formal CI pipeline. Work happens directly on `main`; there are no PR templates, no automated test suite, and no release branches. The practical workflow is: edit, run `npm run dev` locally against Supabase, verify in the browser, commit to `main`.

## Branching & Releases

- Trunk-based: commits land directly on `main` (see recent history with conventional-ish prefixes like `feat:`, `fix:`).
- No version tags or release branches; "releases" are just deploys of the latest `main` (Vercel/Cloud Run style deployment implied by `APP_URL` env var and the `dist/server.cjs` production bundle).
- Commit messages are written in Portuguese and follow a loose `type: description` convention (`feat:`, `fix:`).

## Local Development

- Install: `npm install`
- Configure `.env` with `GEMINI_API_KEY` (required for OCR) and Supabase credentials consumed by `src/lib/supabase.ts` / `server/supabase.ts`
- Run dev server (Express + Vite middleware, HMR): `npm run dev`
- Build for production: `npm run build` (Vite build + esbuild bundle of `server.ts` to `dist/server.cjs`)
- Run production build: `npm start`
- Preview the Vite build only: `npm run preview`
- Type-check: `npm run lint` (runs `tsc --noEmit` — there is no ESLint config)
- Clean build artifacts: `npm run clean`
- Verify Supabase connectivity/tables: `node scripts/test_supabase_connection.js`, `node scripts/verify_supabase_tables.js`

## Code Review Expectations

There is no reviewer other than the two users of the app; there is no `AGENTS.md`. When making changes, prioritize: not breaking the dual Supabase/local-JSON data path, keeping `src/shared/taxonomy.ts` category IDs in sync between the OCR prompt and the UI, and running `npm run lint` (tsc) before considering a change done, since there is no test suite to catch regressions.

## Onboarding Tasks

New contributors should read [README.md](../../README.md) for the full feature catalog and API route list, then skim `src/types.ts` (the single source of truth for domain shapes) and `src/shared/taxonomy.ts` (category/subcategory IDs shared between OCR and UI) before touching any feature area.
