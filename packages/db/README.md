# @itin/db

Prisma schema, generated client, and migration tooling.

## Local Postgres

Use the Docker Compose service at the repo root:

```sh
docker compose up -d postgres
```

This exposes Postgres on `localhost:5432` with credentials matching the default `DATABASE_URL` in `.env.example`:

```
postgresql://postgres:postgres@localhost:5432/itin
```

If you already have Postgres locally or want to point at a Railway-hosted dev DB, just edit `.env`.

## Scripts

Run from anywhere in the monorepo:

```sh
bun db:generate     # generate the Prisma client into node_modules
bun db:migrate      # create + run a dev migration (prompts for a name)
bun db:push         # push schema to db without creating a migration (early-dev only)
bun db:studio       # open Prisma Studio
```

In production / Railway, the api service runs `prisma migrate deploy` on boot via its start command.

## Schema overview

| Table         | Purpose                                                       |
| ------------- | ------------------------------------------------------------- |
| `User`        | Account record (Better Auth + our `firstName` / `lastName`)   |
| `Account`     | OAuth provider linkage (Apple) — Better Auth managed          |
| `Session`     | Cookie-backed sessions — Better Auth managed                  |
| `Verification`| Email / token verifications — Better Auth managed             |
| `Party`       | A trip                                                        |
| `PartyMember` | Membership in a trip with a role (`HOST` / `MEMBER`)          |
| `Invite`      | Shareable token that grants membership when claimed           |

Activity / RSVP tables are intentionally deferred to the next planning round.
