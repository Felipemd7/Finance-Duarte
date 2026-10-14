---
type: agent
name: Code Reviewer
description: Review changes for correctness, consistency, and risk
agentType: code-reviewer
phases: [R]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent before considering a change complete — there's no CI or second human reviewer on this project, so review substitutes for automated gates.

## Responsibilities

- Check that `src/types.ts` changes are propagated to both the Supabase path (`src/services/supabaseService.ts`) and, where applicable, `server/db.ts`
- Check that new category/subcategory IDs are added consistently in `src/shared/taxonomy.ts` (used by both the OCR prompt and the UI)
- Check that new Express routes in `server.ts` have an error-handling pattern consistent with existing routes (never throw unhandled, always return a JSON shape the client expects)
- Verify `npm run lint` passes (the only automated gate available)
- Flag any new unauthenticated endpoint as expected-but-notable given the app's no-auth design (see [../docs/security.md](../docs/security.md)), not as a silent bug

## Best Practices

- There's no test suite, so review should include "did the author describe how they manually verified this in the browser?"
- Watch for drift between the README's documented API catalog and the actual routes in `server.ts` — the README currently documents some endpoints (`/api/auth/login`, `/api/transactions`, etc.) that don't exist in `server.ts` as written; don't let new work assume those routes already exist
- Watch for the Supabase/local-JSON dual-path pattern: a fix applied to one path but not the other is a common source of bugs here

## Key Project Resources

- [README.md](../../README.md)
- [../docs/architecture.md](../docs/architecture.md)
- [../docs/testing-strategy.md](../docs/testing-strategy.md)

## Repository Starting Points

- Whole repo — this agent's job is cross-cutting consistency, not one directory

## Key Files

- [src/types.ts](../../src/types.ts) — the shape every layer must agree on
- [src/shared/taxonomy.ts](../../src/shared/taxonomy.ts)
- [server.ts](../../server.ts)

## Architecture Context

- Review should trace changes across all five layers (Config, Controllers, Utils, Services, Components) when the change touches a shared type

## Key Symbols for This Agent

- `Transaction`, `Receipt`, `ShoppingListItem`, `FinancialGoal` — [src/types.ts](../../src/types.ts)
- `buildTaxonomyPromptBlock` — [src/shared/taxonomy.ts:69](../../src/shared/taxonomy.ts)

## Documentation Touchpoints

- [../docs/architecture.md](../docs/architecture.md)
- [../docs/security.md](../docs/security.md)
- [../docs/testing-strategy.md](../docs/testing-strategy.md)

## Collaboration Checklist

1. Confirm `npm run lint` passes.
2. Confirm type changes propagated to all consumers (`src/types.ts` → services → components/server routes).
3. Confirm the author manually verified the change in the browser.
4. Confirm no new security assumption was silently introduced (e.g. trusting a client-supplied field for something sensitive).
5. Confirm category/taxonomy changes are mirrored between `src/shared/taxonomy.ts` and any Gemini prompt text.

## Hand-off Notes

Since there is no CI, the review step is the last line of defense — prefer asking the author to manually re-test in the browser over approving based on code reading alone for anything touching OCR or Supabase sync.
