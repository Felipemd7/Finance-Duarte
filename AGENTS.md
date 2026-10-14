# AGENTS.md

## Dev environment tips
- Install dependencies with `npm install` before running scaffolds.
- Use `npm run dev` for the interactive TypeScript session that powers local experimentation.
- Run `npm run build` to refresh the CommonJS bundle in `dist/` before shipping changes.
- Store generated artefacts in `.context/` so reruns stay deterministic.

## Testing instructions
- Execute `npm run test` to run the Jest suite.
- Append `-- --watch` while iterating on a failing spec.
- Trigger `npm run build && npm run test` before opening a PR to mimic CI.
- Add or update tests alongside any generator or CLI changes.

## PR instructions
- Follow Conventional Commits (for example, `feat(scaffolding): add doc links`).
- Cross-link new scaffolds in `docs/README.md` and `agents/README.md` so future agents can find them.
- Attach sample CLI output or generated markdown when behaviour shifts.
- Confirm the built artefacts in `dist/` match the new source changes.

## Repository map
- `api/` — endpoints serverless para Vercel.
- `server/` — backend Express e analisadores de recibos (Gemini Vision / Audio / Text).
- `server/whatsapp/` — serviço de bot de WhatsApp autônomo (whatsapp-web.js, ingestão, confirmações e telemetria).
- `src/` — aplicação frontend React 19 + Vite + TailwindCSS.
- `src/shared/taxonomy.ts` — categorização e mapeamento canônico de despesas.
- `GEMINI.md` — memória arquitetural e regras de negócio do casal Duarte.
- `package.json` — dependências e scripts (`npm run dev`, `npm run build`, `npm run whatsapp-bot`).

## AI Context References
- Documentation index: `.context/docs/README.md`
- Agent playbooks: `.context/agents/README.md`
- Contributor guide: `CONTRIBUTING.md`
