# Setup troubleshooting

## `zsh: command not found: bun`

Install Bun ≥ 1.2 (see [bun.sh](https://bun.sh)) and ensure it is on your `PATH`:

```sh
which bun   # e.g. /opt/homebrew/bin/bun
```

## Docker: `docker.sock: no such file or directory`

Docker Desktop (or the Docker daemon) is not running. Start it, then:

```sh
docker compose up -d postgres
```

## Port 5432 already allocated

Another Postgres (often another Docker project) is using host port **5432**. This repo uses **5433** on the host:

```yaml
# docker-compose.yml
ports:
  - "5433:5432"
```

Use in `.env`:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/itin
```

If `itin-postgres` started without a host port mapping, recreate it:

```sh
docker compose down
docker compose up -d postgres
docker port itin-postgres   # expect 0.0.0.0:5433->5432/tcp
```

## Prisma P1001 — Can't reach database server

Postgres is not running or `DATABASE_URL` points at the wrong host/port. Fix Docker or the URL, then:

```sh
bun db:migrate
```

## Prisma: `Unknown field phoneNumber` on `User` (PATCH `/api/me` 500)

The database migration ran but the **generated Prisma client** is stale (common after pulling schema changes while `bun dev` is running).

```sh
bun run db:generate   # or: bun install  (runs generate via @itin/db postinstall)
```

Then **restart** the API (`Ctrl+C`, `bun dev` again). Bun hot-reload does not reload the Prisma client.

## Prisma P1000 — Authentication failed for user `postgres`

You are connecting to **the wrong** Postgres instance (e.g. host 5432 while credentials expect the itin Docker container on **5433**). Align `DATABASE_URL` with the instance you intend.

## `psql "$DATABASE_URL"` fails in the shell

`DATABASE_URL` is not exported in your terminal. Either:

```sh
psql postgresql://postgres:postgres@localhost:5433/itin -c 'SELECT 1'
```

or load from `packages/db/.env` explicitly.

## REST Client (`.http`) — response tab flashes closed

The API is fine if the terminal logs `200`; the issue is Cursor/REST Client UI (response tab opens then closes; **Request History** still has the body).

### Reliable alternatives (use these)

```sh
bun run api:test              # health + config + dev-login + /api/me
./scripts/api-http.sh health  # single endpoint
```

Or **Terminal → Run Task** → `api: health` / `api: auth config` (see [`.vscode/tasks.json`](../../.vscode/tasks.json)).

### Stable side-by-side (recommended)

The HTML “beside” preview **flashes** in Cursor; use a **pinned file** on the right instead:

1. Open `rest.http`, **split editor right** (`Cmd+\`).
2. In the **right** pane, open [`.vscode/api-response.http`](../../.vscode/api-response.http).
3. **Run Task** → **`api: health → side panel`** (updates the right file; focus stays on the left).
4. Keep sending from `rest.http` on the left; re-run tasks or use `bun run api:test` for scripts.

### REST Client “Send Request”

1. **Developer: Reload Window** after pulling repo settings.
2. Workspace uses a **persistent untitled tab** (`previewResponseInUntitledDocument` + `enablePreview: false`). Close discard tabs normally if prompted.
3. `previewResponsePanelTakeFocus: false` — focus should stay on `rest.http`.
4. **Request History** still has every body if a tab disappears.

## Google OAuth

- Redirect URI (local): `http://localhost:3001/api/auth/callback/google`
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/api/.env`
- Sign-in page shows Google only when `GET /api/auth/config` returns `google: true`

See [apps/api/README.md](../../apps/api/README.md).
