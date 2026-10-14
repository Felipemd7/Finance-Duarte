---
type: doc
name: glossary
description: Project terminology, type definitions, domain entities, and business rules
category: glossary
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Glossary & Domain Concepts

Finanças Casal Duarte is a shared household-finance tracker for a couple ("Casal Duarte" — Felipe and Camila). Core domain entities revolve around money moving between two people, categorized spending, receipts read by AI, and a household shopping list.

## Type Definitions

- `User`, `Category`, `Subcategory`, `Establishment` — [src/types.ts:30-72](../../src/types.ts)
- `Transaction`, `PartnerSplit`, `PurchaseItem` — [src/types.ts:80-137](../../src/types.ts)
- `Receipt`, `ReceiptData` — [src/types.ts:137-160](../../src/types.ts)
- `FinancialGoal` — [src/types.ts:183](../../src/types.ts)
- `ShoppingListItem` — [src/types.ts:215](../../src/types.ts)
- `SpreadsheetRow` — [src/types.ts:239](../../src/types.ts)
- `CategoryBudget`, `BudgetCategoryItem`, `CarPlanningItem` — [src/types.ts:258-301](../../src/types.ts)
- `FuelLog`, `Vehicle` — [src/types.ts:266-312](../../src/types.ts)
- `DashboardMetrics`, `WeeklyMetric` — [src/types.ts:324-334](../../src/types.ts)
- `ConsumedItemDetail`, `TrackedItemEvolution`, `SupermarketCategoryBreakdown`, `MeatCutAnalysis`, `MeatTypeBreakdown`, `MeatEvolutionMonth`, `TopPurchasedItem`, `SupermarketAnalytics` — [src/types.ts:388-474](../../src/types.ts)
- `AnalyzedReceiptItem`, `AnalyzedReceipt`, `AnalyzedFuelReceipt` — [server/receiptAnalyzer.ts:130-261](../../server/receiptAnalyzer.ts)
- `SubcategoryTaxonomyEntry` — [src/shared/taxonomy.ts:7](../../src/shared/taxonomy.ts)

## Enumerations

- `CategoryType` — [src/types.ts:6](../../src/types.ts)
- `PaymentMethod` — [src/types.ts:8](../../src/types.ts)
- `TransactionStatus` — [src/types.ts:26](../../src/types.ts)
- `TransactionType` — [src/types.ts:27](../../src/types.ts)
- `UserRole` — [src/types.ts:28](../../src/types.ts)
- `EstablishmentType` — [src/types.ts:61](../../src/types.ts)

## Core Terms

- **Invariável / Variável / Extra**: the three budget macrocategories the couple's spreadsheets use. Invariável = fixed costs (rent, condo, internet); Variável = recurring day-to-day spending (supermarket, fuel, farmácia, lazer); Extra = sporadic/vehicle/large purchases (maintenance, IPVA, furniture). Mapped via `src/shared/taxonomy.ts`.
- **Divisão do Casal (`divisaoCasal` / `PartnerSplit`)**: the 50/50 (or custom) split of a transaction's value between Felipe and Camila, computed in `server.ts` for OCR'd receipts (`porcentagemFelipe`, `porcentagemGenivania`, `valorFelipe`, `valorGenivania` — note the legacy field names still reference "Genivânia" from an earlier persona before the rename to Camila).
- **Reconciliação (Reconciliation)**: fuzzy-token matching between a scanned receipt's items and the pending `ShoppingListItem` list to auto-mark items as bought and surface impulse purchases, implemented in `ShoppingListView.tsx`.
- **Teto orçamentário (budget ceiling)**: the per-subcategory spending cap tracked by `CategoryBudget`/`BudgetCategoryItem`, with "estouro" (overflow) flags when actual spend exceeds the ceiling.
- **Planilha de fechamento (closing sheet)**: the couple's monthly Excel spreadsheet (see `planilhas/`), which the app imports via `SpreadsheetImporter` and keeps in bidirectional sync via `monthlySheetConfig.ts`.
- **Inflação MoM (Month-over-Month)**: the price-variation metric computed per grocery item across months in the Supermarket Analytics view (`TrackedItemEvolution`).

## Acronyms & Abbreviations

- **OCR**: Optical Character Recognition — performed here via Gemini Vision, not a traditional OCR engine.
- **NFC-e / SAT / CF-e / DANFE**: Brazilian fiscal document formats (electronic consumer invoice variants) that the receipt scanner is tuned to read.
- **BRL**: Brazilian Real, the only currency the app formats (`formatBRL`/`parseBRL` in `src/utils/formatters.ts`).
- **MoM**: Month-over-Month.

## Personas / Actors

- **Felipe Duarte** (`usr-felipe`) and **Camila Duarte** — the two household members (note: several server-side fields still literally say "Genivânia", an earlier name for the same persona now called Camila in the UI/README).
- **Alexa / Siri**: synthetic "actors" that interact with the system via voice webhooks rather than the UI, attributed as the `adicionadoPor`/`source` of an action.

## Domain Rules & Invariants

- Every transaction ultimately resolves to a 50/50 split between the two partners unless a different `PartnerSplit` is specified.
- Category/subcategory IDs must stay consistent between `src/shared/taxonomy.ts` (used by the UI) and the Gemini OCR prompt (`buildTaxonomyPromptBlock`) — if one is extended without the other, OCR'd items can get a category the UI doesn't recognize.
- Monetary values are always in BRL and parsed/formatted with Brazilian conventions (comma as decimal separator) via `src/utils/formatters.ts`.
