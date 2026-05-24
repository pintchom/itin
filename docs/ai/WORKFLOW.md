# Workflow — humans + agents

## Principles

1. **Small diffs** — One concern per change; easier review and safer agent runs.
2. **Read before write** — Match naming, patterns, and imports in neighboring files.
3. **Shared types** — Put Zod schemas in `packages/shared`; API + web stay in sync.
4. **No secrets in git** — Only `.env.example`; real values stay local or in Railway.

## Session flow (agents)

```mermaid
flowchart LR
  Start[Session start] --> AGENTS[Read AGENTS.md]
  AGENTS --> TODO[Scan TODO.md]
  TODO --> Standup[Read today standup]
  Standup --> Work[Implement task]
  Work --> Check[typecheck + lint]
  Check --> Update[Update TODO + standup]
```

## Code conventions

- **API**: Hono routes in `apps/api/src/routes/`; auth via Better Auth at `/api/auth/*`.
- **Web**: TanStack Router pages in `apps/web/src/pages/`; data via Hono RPC client in `lib/api.ts`.
- **DB**: Prisma schema in `packages/db/prisma/schema/`; migrate with `bun db:migrate`.
- **Format/lint**: Biome — `bun lint` / `bun lint:fix`.

## Local Postgres

Docker Compose maps host **5433** → container 5432 to avoid clashing with other projects on 5432.

Default `DATABASE_URL`:

```text
postgresql://postgres:postgres@localhost:5433/itin
```

Set this in `apps/api/.env` and `packages/db/.env`. See [SETUP-TROUBLESHOOTING.md](SETUP-TROUBLESHOOTING.md).

## Commits and PRs

- Commit only when the user asks.
- PR description: what, why, and how to test.
- Link to TODO item or issue when applicable.

## Feedback loop (when corrected)

If a programmer says you messed up or pushes back on your work:

1. Fix the immediate issue.
2. State the **general rule** that prevents recurrence.
3. Append it to [LEARNINGS.md](LEARNINGS.md) (dated bullet under the right category).

Cursor enforces this via `.cursor/rules/learn-from-feedback.mdc` (`alwaysApply`).

## When to update docs

| Event | Update |
| --- | --- |
| Finished a TODO item | Move checkbox to **Done** in [TODO.md](TODO.md) |
| End of session with progress | [standups](../standups/) for today |
| User corrected an agent mistake | [LEARNINGS.md](LEARNINGS.md) |
| New recurring setup issue | [SETUP-TROUBLESHOOTING.md](SETUP-TROUBLESHOOTING.md) |
| New product theme | [ROADMAP.md](ROADMAP.md) (brief bullet) |

## Anti-patterns

- Large drive-by refactors unrelated to the task
- New dependencies without need
- Duplicating validation logic outside `@itin/shared`
- Skipping `bun typecheck` after API or type changes
