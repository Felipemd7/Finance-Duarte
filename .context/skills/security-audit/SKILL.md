---
type: skill
name: Security Audit
description: Audit this repo for security issues given its unauthenticated, two-user household-app design
skillSlug: security-audit
phases: [R, V]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Confirm `GEMINI_API_KEY` and Supabase credentials are only read in `server/`, `api/`, or via `dotenv` — never bundled into client code under `src/`.
2. Check `.gitignore` covers `.env`/`.env.local`.
3. Review any new `/api/*` route for the fact that there is no authentication middleware anywhere in `server.ts` — this is accepted for this project's scope (private household app), but should never be assumed to generalize if the app is ever exposed more broadly.
4. Check base64 image handling in OCR routes stays within the 25MB `express.json` limit and isn't persisted as raw files unexpectedly.

## Examples

**Correct secret usage pattern (server-side only):**
```ts
// server/supabase.ts / server/receiptAnalyzer.ts
import dotenv from 'dotenv';
dotenv.config();
// process.env.GEMINI_API_KEY used here, never in src/
```

## Quality Bar

- Zero secrets in `src/` (client bundle)
- No new route trusts a client-supplied identity field for anything beyond cosmetic attribution (`adicionadoPor`)
- Flag, don't silently fix, any discovery that the app's lack of auth is becoming a real risk (e.g. a deployment plan to expose it publicly)

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
