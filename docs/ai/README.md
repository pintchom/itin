# AI vibe coding hub

This folder is the **single source of truth** for how humans and coding agents collaborate on **itin** — a mobile-first PWA for group trip itineraries.

## Quick links

| Doc | Purpose |
| --- | --- |
| [TODO.md](TODO.md) | Prioritized backlog (`Now` / `Next` / `Done`) |
| [ROADMAP.md](ROADMAP.md) | Thematic future work (not committed dates) |
| [WORKFLOW.md](WORKFLOW.md) | Best practices for agents and humans |
| [LEARNINGS.md](LEARNINGS.md) | Rules from past mistakes (feedback loop) |
| [SETUP-TROUBLESHOOTING.md](SETUP-TROUBLESHOOTING.md) | Docker, Postgres port, auth errors |
| [AUTH.md](AUTH.md) | Email, phone, Google, and dev sign-in |
| [GOOGLE-OAUTH.md](GOOGLE-OAUTH.md) | Google sign-in setup and testing |
| [../standups/README.md](../standups/README.md) | Daily team standups |

Agents: also read [AGENTS.md](../../AGENTS.md) at repo root on every session startup.

## What we're building

Hosts create a **party** (trip), invite others via link, and share a calendar-style day view. The current codebase has auth, parties, invites, and a calendar **shell**; activities on the calendar are planned next (see [ROADMAP.md](ROADMAP.md)).

## How to pick work

1. User instruction overrides everything.
2. Otherwise, take the top unchecked item in **Now** on [TODO.md](TODO.md).
3. If blocked, note it in today's standup and ask the user or pick **Next**.

## Quality bar

Before finishing a task:

```sh
bun typecheck
bun lint
```

Manual smoke test when touching auth, API, or UI flows.

## Branches

Use descriptive branches (e.g. `feature/google-oauth`, `feature/vibe-infra`). Keep PRs small and reviewable.

## After a session

- Move completed items to **Done** on [TODO.md](TODO.md).
- Add bullets under your name in `docs/standups/YYYY-MM-DD.md`.

## Stack reminder

Bun monorepo · Hono API · React 19 + Vite · Prisma + Postgres · Better Auth · Railway deploy

Product setup: [README.md](../../README.md)
