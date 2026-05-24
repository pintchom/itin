# Agent onboarding (itin)

Read this at the start of every session before writing code.

## Startup checklist

1. Read [docs/ai/README.md](docs/ai/README.md) — vibe coding hub and conventions.
2. Scan [docs/ai/TODO.md](docs/ai/TODO.md) — pick work from **Now** unless the user directed otherwise.
3. Skim [docs/ai/LEARNINGS.md](docs/ai/LEARNINGS.md) — durable rules from past corrections.
4. Read today's standup: `docs/standups/YYYY-MM-DD.md` (latest date in that folder).
5. Skim [README.md](README.md) for product context and local setup.

## Repository layout

```
apps/web/          Vite + React PWA (port 5173)
apps/api/          Hono + Bun API (port 3001)
packages/db/       Prisma schema + migrations
packages/shared/   Zod schemas + shared utils
packages/config/   Shared tsconfig presets
docs/ai/           TODO, ROADMAP, workflow for agents
docs/standups/     Daily team standups
```

## Commands

```sh
bun install
docker compose up -d postgres   # Postgres on localhost:5433
bun dev                         # web + api via Turbo
bun typecheck
bun lint
bun db:migrate                  # after schema changes
```

## Rules of engagement

- **Do not commit** unless the user explicitly asks.
- **Do not commit** `.env` files or secrets.
- Prefer small, focused diffs; match existing patterns (Hono RPC, TanStack Query, `@itin/shared`).
- After meaningful work: update [docs/ai/TODO.md](docs/ai/TODO.md) and today's standup.
- When corrected for a mistake: generalize a reusable rule and append it to [docs/ai/LEARNINGS.md](docs/ai/LEARNINGS.md) (see `.cursor/rules/learn-from-feedback.mdc`).
- Run `bun typecheck` and `bun lint` before considering a task done.

## Auth (local dev)

- Dev login: first/last name when `DEV_AUTH_ENABLED=1` in `apps/api/.env`.
- Google OAuth: set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; see [apps/api/README.md](apps/api/README.md).

## Further reading

- [docs/ai/WORKFLOW.md](docs/ai/WORKFLOW.md) — collaboration practices
- [docs/ai/SETUP-TROUBLESHOOTING.md](docs/ai/SETUP-TROUBLESHOOTING.md) — common setup issues
- [apps/api/README.md](apps/api/README.md) — API routes and Railway deploy
