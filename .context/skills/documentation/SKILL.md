---
type: skill
name: Documentation
description: Write and maintain documentation for this repo (README.md and .context/docs/)
skillSlug: documentation
phases: [C]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Determine which document applies: `README.md` (Portuguese, user/feature-facing, emoji section headers) or `.context/docs/*.md` (English, technical, generated-doc tone).
2. Before updating, cross-check the current claim against the actual code (especially `server.ts`'s route table, which the README's endpoint catalog has drifted from in places).
3. Update the specific section rather than rewriting the whole document.
4. Keep cross-references between `.context/docs/*.md` files consistent (e.g. architecture.md ↔ data-flow.md).

## Examples

**README style to match (Portuguese, emoji headers, tables):**
```markdown
## 📡 Catálogo de Endpoints da API REST

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/health` | Healthcheck do servidor |
```

**`.context/docs/` style to match (English, technical, frontmatter):**
```markdown
---
type: doc
name: architecture
...
---

## Architecture Notes

Finanças Casal Duarte is a single Node.js/TypeScript app that serves...
```

## Quality Bar

- Never document a route or behavior without checking it actually exists in `server.ts`
- Keep the Portuguese/English split between README and `.context/docs/` intact
- Prefer concrete file links (`[path](path)`) over vague references

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
