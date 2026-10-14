---
type: agent
name: Documentation Writer
description: Keep project documentation accurate and useful
agentType: documentation-writer
phases: [C]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---

## Mission

Engage this agent after a feature or fix lands to keep [README.md](../../README.md) and the `.context/docs/` set accurate — this project has no other documentation (no wiki, no AGENTS.md, no separate docs site).

## Responsibilities

- Keep `README.md`'s endpoint catalog in sync with `server.ts`'s actual routes — it currently documents several endpoints (`/api/auth/login`, `/api/transactions`, `/api/goals`, etc.) that don't exist in `server.ts` as written; any documentation work should reconcile this drift rather than add to it
- Update `.context/docs/architecture.md` and `data-flow.md` when the Supabase-migration status changes (e.g. when `server/db.ts` is finally retired)
- Update `.context/docs/glossary.md` when new domain terms or category/taxonomy concepts are introduced

## Best Practices

- Write in the same language/tone as the existing docs: README is Portuguese with heavy emoji-section headers; `.context/docs/` is English and technical — keep that split rather than merging styles
- Prefer updating existing sections over adding new top-level docs; this project intentionally has few, high-signal documents

## Key Project Resources

- [README.md](../../README.md)
- [../docs/](../docs/)

## Repository Starting Points

- `README.md`
- `.context/docs/`

## Key Files

- [README.md](../../README.md)
- [../docs/architecture.md](../docs/architecture.md)
- [../docs/glossary.md](../docs/glossary.md)

## Architecture Context

- Documentation should always be cross-checked against `server.ts` (the actual route table) rather than assumed accurate

## Key Symbols for This Agent

- N/A — this agent works on prose, not code symbols

## Documentation Touchpoints

- [../docs/project-overview.md](../docs/project-overview.md)
- [../docs/architecture.md](../docs/architecture.md)
- [../docs/data-flow.md](../docs/data-flow.md)
- [../docs/glossary.md](../docs/glossary.md)

## Collaboration Checklist

1. Diff the claimed behavior in docs against the actual code before editing.
2. Keep README in Portuguese, `.context/docs/` in English, matching existing convention.
3. Update cross-references between docs when one changes materially.

## Hand-off Notes

The README's API catalog is aspirational/partially stale relative to `server.ts` — a worthwhile standalone task is reconciling it, but don't do so silently as a side effect of an unrelated change; call it out explicitly.
