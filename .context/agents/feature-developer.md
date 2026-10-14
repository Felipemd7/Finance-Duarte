---
type: agent
name: Feature Developer
description: Implement new end-to-end features
agentType: feature-developer
phases: [P, E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent for a feature that spans the full stack — a new budget-tracking view, a new voice-assistant intent, a new analytics breakdown — anything that needs a type, a service function, a route (if applicable), and a UI component together.

## Responsibilities

- Add/extend types in `src/types.ts` first
- Add the corresponding CRUD/query function to `src/services/supabaseService.ts` (and, if the feature needs voice/demo support, to `server.ts`'s in-memory store or `server/db.ts`)
- Build the UI in a new or existing `src/components/*View.tsx`, wired through `src/App.tsx`
- If the feature involves categorization, extend `src/shared/taxonomy.ts` so OCR and UI agree
- Update the README's feature catalog and endpoint table if the feature adds a new API route

## Best Practices

- Follow the existing per-view component + props-interface convention rather than inventing a new pattern
- Reuse `src/utils/formatters.ts` and `src/utils/payer.ts` instead of re-implementing currency/date/payer logic
- Keep new Supabase tables/columns documented in a migration under `supabase/migrations/`

## Key Project Resources

- [README.md](../../README.md) — feature catalog and example endpoints
- [../docs/project-overview.md](../docs/project-overview.md)
- [../docs/data-flow.md](../docs/data-flow.md)

## Repository Starting Points

- `src/types.ts`, `src/services/`, `src/components/`, `supabase/migrations/`

## Key Files

- [src/types.ts](../../src/types.ts)
- [src/services/supabaseService.ts](../../src/services/supabaseService.ts)
- [src/App.tsx](../../src/App.tsx)
- [src/shared/taxonomy.ts](../../src/shared/taxonomy.ts)

## Architecture Context

- A typical new feature touches Config (if a new env var) → Services → Components, occasionally also Controllers (`server.ts`) for voice/demo support

## Key Symbols for This Agent

- `DashboardMetrics`, `SupermarketAnalytics`, `FinancialGoal` — [src/types.ts](../../src/types.ts)
- `getCachedCategories`, `getCachedCarCosts` — [src/services/budgetCategoriesService.ts:19,23](../../src/services/budgetCategoriesService.ts)
- `getMonthSheetConfig` — [src/services/monthlySheetConfig.ts:25](../../src/services/monthlySheetConfig.ts)

## Documentation Touchpoints

- [../docs/project-overview.md](../docs/project-overview.md)
- [../docs/glossary.md](../docs/glossary.md)

## Collaboration Checklist

1. Define/extend the type in `src/types.ts`.
2. Add the service function(s) in `src/services/`.
3. Build or extend the view component.
4. Update taxonomy if new categories are introduced.
5. Update README if a new API route or major feature is added.
6. Run `npm run lint` and manually test in the browser.

## Hand-off Notes

Check `src/components/MonthlyBudgetSpreadsheetPanel.tsx` and `src/services/monthlySheetConfig.ts` before building anything budget-related — there's already a bidirectional sync mechanism between the app and the couple's closing spreadsheet that a new feature should plug into rather than duplicate.
