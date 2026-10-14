---
type: skill
name: Feature Breakdown
description: Break a new feature request into concrete implementation steps across this app's layers
skillSlug: feature-breakdown
phases: [P]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Identify the domain shape: does the feature need a new/changed type in `src/types.ts`?
2. Identify the persistence need: Supabase only (`src/services/supabaseService.ts` + a migration under `supabase/migrations/`), or does it also need legacy `server/db.ts` support for local-demo parity?
3. Identify the UI surface: a new `src/components/*View.tsx`, or an addition to an existing view?
4. Identify cross-cutting pieces: new category/subcategory → `src/shared/taxonomy.ts`; new currency/date formatting need → `src/utils/formatters.ts`; new voice intent → `server.ts`'s Alexa/Siri handlers.
5. Sequence the steps: type → migration/service → route (if any) → UI → README update.

## Examples

**Breakdown for "add a vehicle-maintenance reminder feature" (illustrative):**
```
1. Add `MaintenanceReminder` type to src/types.ts
2. Add supabase/migrations/<date>_maintenance_reminders.sql + schema.sql update
3. Add CRUD functions to src/services/supabaseService.ts
4. Add/extend a view (likely inside the existing car-cost section of GoalsView.tsx or FuelManagementSection.tsx)
5. Update README feature catalog if user-facing
```

## Quality Bar

- Every breakdown should explicitly call out the Supabase-vs-legacy-JSON decision rather than leaving it implicit
- Flag any new category/taxonomy entry needed, since it's easy to forget and causes OCR/UI mismatches later

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
