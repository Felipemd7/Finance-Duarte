---
type: agent
name: Frontend Specialist
description: Build and refine UI components and client-side state
agentType: frontend-specialist
phases: [P, E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent for work on the React 19 SPA: the ~25 view/panel components in `src/components/`, state flow through `src/App.tsx`, and styling with Tailwind CSS v4.

## Responsibilities

- Add or modify view components in `src/components/` (Dashboard, Transactions, Scanner, Goals, ShoppingList, SupermarketAnalytics, SpreadsheetImporter, VoiceIntegrations, etc.)
- Wire components to `src/services/*` for data access rather than calling Supabase or `fetch` directly from components
- Use `src/utils/formatters.ts` for all currency/date display (`formatBRL`, `formatDateBR`) instead of ad hoc formatting
- Maintain mobile-first layout via `MobileNavigation.tsx` / `BottomNav.tsx`, since this is primarily used on phones
- Use `recharts` for any new chart (consistent with `DashboardView.tsx`, `SupermarketAnalyticsView.tsx`) and `motion` for transitions

## Best Practices

- Keep all user-facing text in Portuguese (pt-BR), matching the rest of the app
- Props-typed components: follow the existing `XxxViewProps` interface pattern (e.g. `TransactionsViewProps`, `ScannerViewProps`) defined alongside each component
- Prefer composing with existing shared types from `src/types.ts` rather than re-declaring local shapes
- Run `npm run lint` after changes — there's no visual regression tooling, so manually check the view in the browser via `npm run dev`

## Key Project Resources

- [README.md](../../README.md) — module/feature catalog per view
- [../docs/project-overview.md](../docs/project-overview.md)
- [../docs/glossary.md](../docs/glossary.md) — domain terms used throughout the UI

## Repository Starting Points

- `src/components/` — all views and panels
- `src/App.tsx` — root component and state orchestration
- `src/index.css` — Tailwind entry point

## Key Files

- [src/App.tsx](../../src/App.tsx) — imported by 14 files, the central state hub
- [src/components/TransactionsView.tsx](../../src/components/TransactionsView.tsx) — imported by 6 files
- [src/components/DashboardView.tsx](../../src/components/DashboardView.tsx)
- [src/components/ScannerView.tsx](../../src/components/ScannerView.tsx)
- [src/utils/formatters.ts](../../src/utils/formatters.ts)

## Architecture Context

- **Components** (`src/components/`) — depends on Utils and Services; 213 symbols, the largest layer in the codebase
- **Utils** (`src/utils/`) — formatters, payer logic, image compression

## Key Symbols for This Agent

- `formatBRL`, `parseBRL`, `formatDateBR`, `getCurrentMonthName` — [src/utils/formatters.ts](../../src/utils/formatters.ts)
- `isCasalPayer`, `isCreditCardPayment` — [src/utils/payer.ts](../../src/utils/payer.ts)
- `compressImage` — [src/utils/imageCompressor.ts:9](../../src/utils/imageCompressor.ts)
- `ErrorBoundary` — [src/components/ErrorBoundary.tsx:13](../../src/components/ErrorBoundary.tsx)

## Documentation Touchpoints

- [../docs/architecture.md](../docs/architecture.md)
- [../docs/glossary.md](../docs/glossary.md)

## Collaboration Checklist

1. Confirm which `src/services/*` function already exposes the data the component needs before adding a new one.
2. Match existing naming/prop conventions (`XxxViewProps`) in the file you're editing.
3. Verify currency/date values go through `src/utils/formatters.ts`.
4. Run `npm run lint`.
5. Manually test in the browser at mobile and desktop widths.

## Hand-off Notes

This app has two parallel "desktop" and generic views for some features (e.g. `GoalsView.tsx` vs `GoalsDesktopView.tsx`) — check for a desktop-specific counterpart before assuming a single component covers all breakpoints.
