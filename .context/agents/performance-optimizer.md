---
type: agent
name: Performance Optimizer
description: Improve runtime and perceived performance
agentType: performance-optimizer
phases: [E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent for perceived slowness — most likely around the Gemini OCR round-trip, large spreadsheet imports, or Supabase fetch waterfalls in analytics views. This is a low-traffic, two-user app, so optimization should target UX latency (perceived responsiveness), not throughput/scale.

## Responsibilities

- Ensure receipt images are compressed via `src/utils/imageCompressor.ts` before upload (`compressImage`) to keep the 25MB payload limit and Gemini latency in check
- Review `src/components/SupermarketAnalyticsView.tsx` and `src/components/MarketAnalyticsReportsView.tsx` for redundant Supabase fetches when switching months/filters
- Review the Gemini fallback chain in `server/receiptAnalyzer.ts` for unnecessary retry delay on genuinely-failed requests vs. transient `503`/`429`s

## Best Practices

- Don't add caching/memoization speculatively — this app has two users and modest data volume (a handful of months of transactions); prioritize correctness over premature optimization
- If introducing caching, follow the existing pattern in `src/services/budgetCategoriesService.ts` (`getCachedCategories`, `getCachedCarCosts`) rather than inventing a new mechanism

## Key Project Resources

- [../docs/architecture.md](../docs/architecture.md)
- [../docs/data-flow.md](../docs/data-flow.md)

## Repository Starting Points

- `src/utils/imageCompressor.ts`
- `src/services/budgetCategoriesService.ts` (existing caching pattern)
- `server/receiptAnalyzer.ts` (OCR latency/retry)

## Key Files

- [src/utils/imageCompressor.ts](../../src/utils/imageCompressor.ts)
- [src/services/budgetCategoriesService.ts](../../src/services/budgetCategoriesService.ts)
- [server/receiptAnalyzer.ts](../../server/receiptAnalyzer.ts)

## Architecture Context

- Services layer already has one caching precedent (`budgetCategoriesService.ts`); new caching should follow that shape

## Key Symbols for This Agent

- `compressImage` — [src/utils/imageCompressor.ts:9](../../src/utils/imageCompressor.ts)
- `getCachedCategories`, `getCachedCarCosts` — [src/services/budgetCategoriesService.ts:19,23](../../src/services/budgetCategoriesService.ts)
- `callGeminiVision` — `server/receiptAnalyzer.ts:98`

## Documentation Touchpoints

- [../docs/data-flow.md](../docs/data-flow.md)

## Collaboration Checklist

1. Measure (even informally, via browser devtools) before optimizing.
2. Prefer reducing request count/payload size over adding new infrastructure.
3. Reuse the existing caching pattern in `budgetCategoriesService.ts` if caching is warranted.
4. Re-verify correctness after any change — this app has no test suite to catch regressions from an optimization.

## Hand-off Notes

Given the scale (two users, ~8 months of data), most "performance" issues are more likely UX/loading-state issues than genuine throughput problems — confirm the actual complaint before assuming a backend bottleneck.
