---
type: agent
name: Security Auditor
description: Identify and remediate security risks
agentType: security-auditor
phases: [R, V]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent when adding anything that touches secrets, external API calls, or data exposure — this app has no authentication layer, so the main risks are credential handling and the blast radius of the fully-open `/api/*` surface.

## Responsibilities

- Audit any new usage of `GEMINI_API_KEY` or Supabase credentials to confirm they stay server-side (`server/supabase.ts`, `server/receiptAnalyzer.ts`) and never leak into client bundles
- Audit new `/api/*` routes in `server.ts` for the fact that they are unauthenticated by design — confirm nothing sensitive beyond the couple's own data is exposed
- Audit base64 image handling in the OCR routes for payload-size limits (`express.json({ limit: '25mb' })`) and ensure no raw images are persisted unexpectedly
- Confirm `.env`/`.env.local` stay out of version control (check `.gitignore`)

## Best Practices

- Treat this as a private, two-user household app, not a multi-tenant product — don't over-engineer auth, but do flag any change that would expose data beyond Felipe/Camila if the app were ever made more widely reachable
- Secrets only via `dotenv`-loaded environment variables, never hardcoded — follow the existing pattern in `server.ts` (`dotenv.config()`) and `server/supabase.ts`

## Key Project Resources

- [../docs/security.md](../docs/security.md)
- [.env.example](../../.env.example)

## Repository Starting Points

- `server.ts`, `server/supabase.ts`, `server/receiptAnalyzer.ts` — where secrets are consumed
- `api/` — serverless functions with their own environment variable access in production

## Key Files

- [server/supabase.ts](../../server/supabase.ts) — `isSupabaseServerConfigured`
- [server/receiptAnalyzer.ts](../../server/receiptAnalyzer.ts) — `getGeminiClient`

## Architecture Context

- No Controllers-layer auth middleware exists; every route in `server.ts` is open

## Key Symbols for This Agent

- `isSupabaseServerConfigured` — [server/supabase.ts](../../server/supabase.ts)
- `getGeminiClient` — [server/receiptAnalyzer.ts:61](../../server/receiptAnalyzer.ts)

## Documentation Touchpoints

- [../docs/security.md](../docs/security.md)

## Collaboration Checklist

1. Confirm no secret is referenced from client-side code (`src/`) — only from `server/` or `api/`.
2. Confirm new routes don't trust client-supplied identity fields for anything consequential.
3. Confirm `.env*` files stay untracked.
4. Flag (don't silently "fix") the absence of authentication as a known, accepted design trade-off unless the user asks to add it.

## Hand-off Notes

If the user ever asks to deploy this beyond the household (e.g. share with others), authentication becomes a hard requirement before that happens — raise this explicitly rather than assuming it's out of scope.
