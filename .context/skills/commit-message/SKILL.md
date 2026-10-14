---
type: skill
name: Commit Message
description: Write commit messages matching this repo's existing convention
skillSlug: commit-message
phases: [E]
generated: 2026-10-13
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Look at `git log` for the most recent 5-10 commits to confirm the current style before writing a new message.
2. Use a `tipo: descrição` prefix in Portuguese, matching this repo's actual history (`feat:`, `fix:`), e.g. `fix: ajustar imports relativos com extensao js no backend`.
3. Describe the "why"/outcome in one line, not a changelog of every file touched.
4. Keep the subject line as a single sentence; this repo does not use multi-paragraph commit bodies in its history.

## Examples

**Real commits from this repo's history:**
```
feat: catalogo de farmacia e lazer nos relatorios e correcao de duplicacao de fuel_logs no scanner
fix: ajustar imports relativos com extensao js no backend e types no receiptNormalizer
feat: adicionar gestao de categorias de orcamento, refatorar OCR/taxonomia e migracao sql
dc1c08f feat: sincronizacao bidirecional de status entre planilha de fechamento e extrato
fix: identificar pagador como Casal no Cartao conjunto Inter Debito e migracao automatica do fechamento
```

## Quality Bar

- Portuguese, lowercase after the `tipo:` prefix, no trailing period
- `feat:` for new capability, `fix:` for a defect correction — matches this repo's only two prefixes in use so far
- One line is almost always enough; this repo doesn't use commit bodies

## Resource Strategy

- Add `scripts/` only when the task is fragile, repetitive, or benefits from deterministic execution.
- Add `references/` only when details are too large or too variant-specific to keep in `SKILL.md`.
- Add `assets/` only for files that will be consumed in the final output.
- Keep extra docs out of the skill folder; prefer `SKILL.md` plus only the resources that materially help.
