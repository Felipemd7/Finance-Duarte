---
type: skill
name: Api Design
description: Design RESTful APIs following best practices. Use when Designing new API endpoints, Restructuring existing APIs, or Planning API versioning strategy
skillSlug: api-design
phases: [P, R]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Check whether the resource already has routes in `server.ts` (shopping list, voice webhooks, OCR, summary KPIs) before adding a new, overlapping one.
2. Follow the existing route style in `server.ts`: `app.get/post/put/delete('/api/<resource>', async (req, res) => { ... })`, not a separate router file — this project has no router abstraction.
3. Return `{ success: true, ... }` / `{ success: false, error, details }` shapes consistently with existing routes (see `/api/scan-receipt`, `/api/shopping-list`).
4. If the route needs OCR or Supabase access, decide whether it also needs a parallel implementation in `api/*.ts` (Vercel serverless) — OCR routes currently do.
5. Update `src/types.ts` for any new request/response shape, then wire the client call through `src/services/supabaseService.ts` if it talks to Supabase, or a direct `fetch` if it's a simple `server.ts` route.
6. Update the README's endpoint table.

## Examples

**This project's existing route style (server.ts):**
```ts
app.post('/api/shopping-list', async (req, res) => {
  const { nome, estabelecimentoTipo = 'Supermercado', ... } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome do item é obrigatório.' });
  }
  // ... build newItem, optionally write to Supabase, update in-memory store
  res.status(201).json({ success: true, item: newItem });
});
```

**Error-tolerant pattern used for OCR routes (never throw unhandled):**
```ts
app.post('/api/scan-receipt', async (req, res) => {
  try {
    // ...
    return res.json({ success: true, data: { ... } });
  } catch (err: any) {
    console.error('[scan-receipt endpoint critical error]:', err?.message || err);
    return res.status(200).json({ success: false, error: 'Não foi possível processar...', details: err?.message });
  }
});
```

## Quality Bar

- Match the existing `{ success, data|item|error }` response envelope rather than inventing a new one
- No versioning scheme exists (`/api/v1/...`) — don't introduce one unilaterally; this is a single-consumer app with one frontend
- Error messages shown to the user are in Portuguese
- Any route touching Supabase must fail soft (log + fallback), consistent with every existing Supabase call site in `server.ts`

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
