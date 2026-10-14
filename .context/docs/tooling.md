---
type: doc
name: tooling
description: Scripts, IDE settings, automation, and developer productivity tips
category: tooling
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Tooling & Productivity Guide

The toolchain is intentionally minimal: npm scripts drive everything, there's no linter beyond the TypeScript compiler, and no CI.

## Required Tooling

- **Node.js 18+** and **npm** — runtime and package manager (see `README.md` prerequisites).
- **tsx** (`^4.21.0`) — runs `server.ts` directly in TypeScript during development (`npm run dev`), no separate compile step.
- **Vite** (`^6.2.3`) with `@vitejs/plugin-react` and `@tailwindcss/vite` — SPA bundler and dev server, mounted as Express middleware in dev.
- **esbuild** (`^0.25.0`) — bundles `server.ts` into `dist/server.cjs` for production (`npm run build`).
- **TypeScript** (`~5.8.2`) — the only enforced static check, run via `npm run lint` (`tsc --noEmit`).
- **Google AI Studio API key** (`GEMINI_API_KEY`) — required for the OCR features to function at all.
- **Supabase project** — URL + anon/service keys for `src/lib/supabase.ts` / `server/supabase.ts`.

## Recommended Automation

There are no pre-commit hooks or code generators configured. Before committing, run `npm run lint` to catch type errors, and manually exercise the changed view in the browser since there's no automated test suite (see [testing-strategy.md](testing-strategy.md)). `npm run clean` removes `dist/` and `server.js` if a build gets into a stale state.

## IDE / Editor Setup

No workspace-specific editor config (`.vscode/`, `.editorconfig`) is present. Any standard TypeScript + Tailwind CSS IntelliSense setup (e.g., VS Code with the Tailwind CSS IntelliSense and ESLint/TypeScript extensions) works without additional configuration since `tsconfig.json` and `vite.config.ts` are standard.

## Productivity Tips

- `npm run dev` gives you both the API and HMR'd frontend on `http://localhost:3000` — there's no need to run separate frontend/backend dev servers.
- Use `scripts/test_supabase_connection.js` and `scripts/verify_supabase_tables.js` as quick sanity checks after changing `.env` Supabase credentials or running a new migration in `supabase/migrations/`.
