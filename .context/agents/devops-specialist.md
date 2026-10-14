---
type: agent
name: DevOps Specialist
description: Manage build, deployment, and infrastructure concerns
agentType: devops-specialist
phases: [E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent for build/deploy questions: the `npm run build`/`npm start` pipeline, the Vercel serverless functions in `api/`, and Supabase project configuration. There is no CI/CD pipeline or containerization in this repo today (`hasDocker: false`, `hasCI: false`).

## Responsibilities

- Maintain the two-stage build: `vite build` (SPA → `dist/`) + `esbuild server.ts → dist/server.cjs`
- Keep the Vercel serverless functions (`api/scan-receipt.ts`, `api/scan-fuel-receipt.ts`) deployable independently of the Express server, since they duplicate logic for a platform that doesn't run a long-lived Node process
- Manage environment variables (`GEMINI_API_KEY`, `APP_URL`, `PORT`, `NODE_ENV`, Supabase credentials) across local `.env` and whatever hosting platform is used (Vercel/Cloud Run per the README's `APP_URL` hint)
- Keep `scripts/test_supabase_connection.js` and `scripts/verify_supabase_tables.js` as the go-to connectivity checks after any infra change

## Best Practices

- There's no Docker/CI to maintain, so changes here are mostly npm-script and environment-variable hygiene — don't introduce container/CI tooling unless the user asks for it
- Any change to `server.ts`'s OCR routes must be mirrored in `api/scan-receipt.ts`/`api/scan-fuel-receipt.ts` or the serverless deployment will silently diverge from local dev behavior

## Key Project Resources

- [README.md](../../README.md) — environment variables table and local setup steps
- [../docs/tooling.md](../docs/tooling.md)

## Repository Starting Points

- `package.json` scripts
- `api/` — serverless deployment surface
- `vite.config.ts`

## Key Files

- [package.json](../../package.json)
- [vite.config.ts](../../vite.config.ts)
- [server.ts](../../server.ts)
- [api/scan-receipt.ts](../../api/scan-receipt.ts)
- [api/scan-fuel-receipt.ts](../../api/scan-fuel-receipt.ts)

## Architecture Context

- Production mode in `server.ts`'s `startServer()` switches from Vite middleware to static-file serving of `dist/` plus an SPA catch-all

## Key Symbols for This Agent

- `startServer` — [server.ts:505](../../server.ts)
- `aistudioMediaPlugin` — [vite.config.ts:8](../../vite.config.ts)

## Documentation Touchpoints

- [../docs/tooling.md](../docs/tooling.md)
- [../docs/architecture.md](../docs/architecture.md)

## Collaboration Checklist

1. Confirm whether a change affects local dev (`npm run dev`), the Express production bundle (`npm run build && npm start`), or the Vercel functions — often all three.
2. Keep `api/*.ts` and `server.ts`'s matching routes in sync.
3. Verify required env vars are documented in `README.md`'s variables table.
4. Run `node scripts/verify_supabase_tables.js` after any infra-affecting change.

## Hand-off Notes

The exact hosting platform isn't pinned down in the repo (no `vercel.json`, no Dockerfile) beyond the `api/` folder convention and the `APP_URL` env var hint — confirm the actual deployment target with the user before assuming Vercel-specific behavior.
