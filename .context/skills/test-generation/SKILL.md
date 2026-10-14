---
type: skill
name: Test Generation
description: Generate tests for this repo (currently no test framework installed)
skillSlug: test-generation
phases: [E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Confirm with the user that adding a test framework is in scope — none exists today (`npm run lint` / `tsc --noEmit` is the only automated check).
2. If proceeding, install **Vitest** (fits the existing Vite 6 toolchain) and add a `test` script to `package.json`.
3. Start with pure, dependency-free functions: `src/utils/formatters.ts`, `src/utils/payer.ts`, `src/shared/taxonomy.ts`.
4. For `src/services/supabaseService.ts`, prefer integration tests against a real (disposable/test) Supabase project over mocks, since this project's recurring bugs are exactly the kind that mocks would hide (field-name/shape mismatches).

## Examples

**First test candidates (illustrative, Vitest syntax):**
```ts
import { describe, it, expect } from 'vitest';
import { formatBRL, parseBRL } from '../utils/formatters';

describe('formatBRL', () => {
  it('formats a number as Brazilian currency', () => {
    expect(formatBRL(1850.35)).toBe('R$ 1.850,35');
  });
});
```

## Quality Bar

- Co-locate as `*.test.ts` next to the source file
- Don't mock Supabase for row-shape mapping functions (`sanitizeDisplayName`, `normalizeFuelType`) — test them against real rows
- Don't over-invest in UI component tests for this small, two-user app; prioritize the data/formatting/classification logic

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
