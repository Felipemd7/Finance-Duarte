---
type: agent
name: Database Specialist
description: Manage schema, migrations, and data integrity
agentType: database-specialist
phases: [P, E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent for changes to the Supabase/Postgres schema (`supabase/schema.sql`, `supabase/migrations/`), seed data (`supabase/seed.sql`), or the legacy JSON schema in `server/db.ts`.

## Responsibilities

- Write new SQL migrations under `supabase/migrations/` following the existing naming convention (`YYYYMMDD_description.sql`, e.g. `20261011_budget_categories_and_car_costs.sql`)
- Keep `supabase/schema.sql` as the canonical full-schema reference in sync with applied migrations
- Mirror any new Supabase column/table in the corresponding TypeScript shape in `src/types.ts` and the mapping logic in `src/services/supabaseService.ts`
- Decide, for each new field, whether the legacy `server/db.ts` JSON schema also needs updating or whether the feature is Supabase-only
- Verify changes with `scripts/verify_supabase_tables.js` and `scripts/test_supabase_connection.js`

## Best Practices

- Never hand-edit data in `supabase/seed.sql` without checking it still matches what `server/db.ts`'s `generateInitialData` seeds for local/dev mode — the two are meant to represent the same Jan–Aug 2026 demo dataset
- Snake_case in SQL/Supabase rows, camelCase in TypeScript — `supabaseService.ts` functions like `sanitizeDisplayName`, `normalizeFuelType` exist specifically to bridge this boundary; follow that pattern for new fields
- Favor additive migrations (new columns/tables) over destructive ones given there's no migration rollback tooling in use

## Key Project Resources

- [../docs/architecture.md](../docs/architecture.md) — dual persistence model
- [../docs/data-flow.md](../docs/data-flow.md)

## Repository Starting Points

- `supabase/` — `schema.sql`, `seed.sql`, `migrations/`
- `server/db.ts` — legacy JSON schema and seed generator
- `src/services/supabaseService.ts` — row ↔ type mapping

## Key Files

- [supabase/schema.sql](../../supabase/schema.sql)
- [supabase/migrations/20261011_budget_categories_and_car_costs.sql](../../supabase/migrations/20261011_budget_categories_and_car_costs.sql)
- [supabase/migrations/20261004_monthly_sheet_config.sql](../../supabase/migrations/20261004_monthly_sheet_config.sql)
- [server/db.ts](../../server/db.ts) — `DatabaseSchema`, `Database`, `generateInitialData`
- [scripts/verify_supabase_tables.js](../../scripts/verify_supabase_tables.js)

## Architecture Context

- **Services** (`src/services/supabaseService.ts`) is the only layer that talks to Supabase from the client; `server/supabase.ts` is the server-side equivalent

## Key Symbols for This Agent

- `DatabaseSchema`, `Database` — [server/db.ts:20,646](../../server/db.ts)
- `fetchSupabaseData`, `LoadedSupabaseData` — [src/services/supabaseService.ts:8,19](../../src/services/supabaseService.ts)
- `sanitizeDisplayName`, `normalizeFuelType` — [src/services/supabaseService.ts:81,333](../../src/services/supabaseService.ts)
- `fetchSubcategoryDefaults` — [src/services/supabaseService.ts:1001](../../src/services/supabaseService.ts)

## Documentation Touchpoints

- [../docs/architecture.md](../docs/architecture.md)
- [../docs/glossary.md](../docs/glossary.md) — taxonomy/category IDs that schema changes must stay consistent with

## Collaboration Checklist

1. Write the migration SQL under `supabase/migrations/` with a dated filename.
2. Update `supabase/schema.sql` to reflect the new canonical shape.
3. Update `src/types.ts` and `src/services/supabaseService.ts` mapping functions.
4. Run `node scripts/verify_supabase_tables.js` to confirm the live schema matches expectations.
5. Decide and document whether `server/db.ts` needs a parallel update.

## Hand-off Notes

There is no migration-runner script checked in — migrations appear to be applied manually via the Supabase dashboard/CLI; confirm the deployment process with the user before assuming migrations auto-apply.
