---
type: agent
name: Refactoring Specialist
description: Improve code structure without changing behavior
agentType: refactoring-specialist
phases: [E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent for structural clean-up: reducing duplication between `server/db.ts` and `src/services/supabaseService.ts`, consolidating repeated formatting/parsing logic, or splitting an overgrown component.

## Responsibilities

- Identify duplicated logic between the legacy JSON path and the Supabase path and consider whether it can be shared via `src/shared/` without breaking either path's independence
- Watch for components that have grown large (e.g. `ShoppingListView.tsx`, `SupermarketAnalyticsView.tsx`, `TransactionsView.tsx` are among the most-imported/most-central) and consider extracting sub-components or hooks when a refactor is requested
- Clean up repeated inline formatting (currency, dates) into calls to `src/utils/formatters.ts`

## Best Practices

- Refactors must be behavior-preserving — since there's no automated test suite, verify before/after manually in the browser for every affected view
- Don't refactor the dual-persistence design away as part of an unrelated cleanup; that's an architectural decision (see `architect-specialist.md`), not a refactor
- Keep diffs focused — this codebase has no CI to catch accidental scope creep

## Key Project Resources

- [../docs/architecture.md](../docs/architecture.md)
- [../docs/development-workflow.md](../docs/development-workflow.md)

## Repository Starting Points

- `src/components/` (largest, most duplication-prone layer — 213 symbols)
- `src/services/supabaseService.ts` vs `server/db.ts`

## Key Files

- [src/components/TransactionsView.tsx](../../src/components/TransactionsView.tsx)
- [src/components/ShoppingListView.tsx](../../src/components/ShoppingListView.tsx)
- [src/services/supabaseService.ts](../../src/services/supabaseService.ts)

## Architecture Context

- Components depend on Utils and Services; refactors that move logic between these layers must preserve that dependency direction (never have Services import from Components)

## Key Symbols for This Agent

- `tokenize` (fuzzy matching) — `src/components/ShoppingListView.tsx:87`
- `sanitizeDisplayName`, `precoL` — [src/services/supabaseService.ts](../../src/services/supabaseService.ts)

## Documentation Touchpoints

- [../docs/architecture.md](../docs/architecture.md)

## Collaboration Checklist

1. Confirm the refactor is behavior-preserving, not a feature change in disguise.
2. Run `npm run lint` before and after.
3. Manually re-test every view touched by the refactor.
4. Keep the diff scoped to the stated refactor.

## Hand-off Notes

Because there's no test suite, prefer small, independently-verifiable refactor commits over one large restructuring pass.
