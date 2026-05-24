# itin

A mobile-first PWA for group trip itineraries. Hosts create a trip ("party"), invite people with a shareable link, and the entire group shares a single Google-Calendar-style vertical day view.

This repo is the foundation — auth, parties, invites, and the empty calendar shell. Activity creation lands in a follow-up plan.

## Stack

| Concern        | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Runtime        | Bun                                                        |
| Backend        | Hono (Bun) + Better Auth + Prisma                          |
| Frontend       | Vite + React 19 + TanStack Router/Query + Tailwind v4      |
| PWA            | `vite-plugin-pwa` (injectManifest) + Workbox precaching    |
| Database       | Postgres                                                   |
| Object storage | Local FS / Railway volume, served by the API               |
| Auth           | Better Auth — Google OAuth + a dev-only name-based login   |
| Deployment     | Railway (web + api services, Postgres plugin, volume)      |

End-to-end types come from Hono's RPC client wired into TanStack Query.

## Layout

```
itin/
  apps/
    web/                Vite + React PWA
    api/                Hono + Bun
  packages/
    db/                 Prisma schema + client
    shared/             Zod schemas + date utils shared web↔api
    config/             Shared tsconfig presets
```

## Local setup

Prereqs: Bun ≥ 1.2, Docker (for local Postgres).

```sh
bun install

# Each package keeps its own .env. Copy the examples:
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env

docker compose up -d postgres
bun db:generate
bun db:migrate            # creates the initial migration
```

Run dev servers in two terminals:

```sh
# API (port 3001)
cd apps/api && bun dev

# Web (port 5173) — proxies /api and /images to the API
cd apps/web && bun dev
```

Open http://localhost:5173. The sign-in screen takes a first/last name and uses the dev-only auth path (gated by `DEV_AUTH_ENABLED=1`).

## Auth

We use Better Auth for sessions + OAuth. Two paths:

1. **Dev login** (`POST /api/dev-login`) — accepts `firstName`/`lastName`, signs you in. Gated by `DEV_AUTH_ENABLED`. Use locally; disable in production.
2. **Google** — provider is enabled when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Create credentials at https://console.cloud.google.com/apis/credentials with the redirect URI `<API_ORIGIN>/api/auth/callback/google`.

See [`apps/api/README.md`](apps/api/README.md) for the full Google setup walkthrough.

## Deployment (Railway)

See [`apps/api/README.md`](apps/api/README.md#deploying-to-railway) — TL;DR:

1. Create a Railway project with three services: Postgres (plugin), `api`, `web`.
2. Attach a 1 GB volume to `api` mounted at `/data/images`.
3. Point each service's "Config-as-Code Path" at `apps/api/railway.toml` and `apps/web/railway.toml`.
4. Set env vars per service (listed in `.env.example` + the api README).
5. Deploy. Migrations run automatically on `api` boot.

## Scripts

```sh
bun dev          # runs turbo dev across apps
bun build        # builds all packages
bun typecheck    # tsc across the workspace
bun lint         # biome check
bun lint:fix     # biome check --write

bun db:generate  # regenerate Prisma client
bun db:migrate   # create + apply a dev migration
bun db:studio    # open Prisma Studio
```
