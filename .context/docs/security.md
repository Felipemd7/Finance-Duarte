---
type: doc
name: security
description: Security policies, authentication, secrets management, and compliance requirements
category: security
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Security & Compliance Notes

This is a personal, two-user household finance app with no formal compliance program. The main security surface is: the Gemini API key, Supabase credentials, and the fact that both `/api/scan-receipt` and the shopping-list API are unauthenticated REST endpoints.

## Authentication & Authorization

There is no authentication layer in `server.ts` — every `/api/*` route is open to anyone who can reach the server. "Identity" is a client-supplied string (`adicionadoPor: 'Felipe' | 'Genivânia'/'Camila'`) with no verification; voice webhook requests are trusted based solely on being POSTed to `/api/voice/alexa` or `/api/voice/siri`. The README references `/api/auth/login` and per-user accounts (`usr-felipe`, `usr-camila`), but this is not implemented in `server.ts` — treat any auth claims in the README as aspirational/legacy from the original planning doc rather than current behavior.

## Secrets & Sensitive Data

- `GEMINI_API_KEY` (required for OCR) and Supabase URL/keys are read from environment variables via `dotenv` (`.env` / `.env.local`, not committed — see `.env.example`).
- `server/supabase.ts` and `src/lib/supabase.ts` construct separate Supabase clients for server and browser contexts; `isSupabaseServerConfigured` gates server-side calls so the app degrades to the local JSON store when credentials are absent rather than failing outright.
- Receipt images are transmitted as base64 in request bodies (up to 25MB, per the `express.json({ limit: '25mb' })` configuration) and are not persisted as raw files — only the OCR-extracted structured data is stored.
- There is no secrets rotation process; this is a personal project, not an enterprise one.

## Compliance & Policies

No formal compliance standards (GDPR/SOC2/etc.) apply — this is a private household tool, not a product serving external customers. Financial data is the couple's own; no third party's PII is processed beyond what's visible on their own receipts (merchant names, CNPJs).

## Incident Response

There is no on-call process. If the Gemini API key is exposed or exhausted, OCR calls will fail and the app falls back to manual entry; if Supabase credentials are exposed, treat it as a direct data-exposure risk for the couple's financial records and rotate keys via the Supabase dashboard.
