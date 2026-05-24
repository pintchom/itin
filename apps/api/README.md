# @itin/api

Hono on Bun. Better Auth + Prisma + Postgres.

## Routes

| Method | Path                              | Auth        | Description                       |
| ------ | --------------------------------- | ----------- | --------------------------------- |
| GET    | `/health`                         | none        | Liveness check                    |
| ANY    | `/api/auth/**`                    | varies      | Better Auth handler (owns this namespace) |
| POST   | `/api/dev-login`                  | dev-only    | Sign in by first + last name      |
| GET    | `/api/me`                         | optional    | Current session user (or `null`)  |
| GET    | `/api/parties`                    | required    | Parties the viewer is a member of |
| POST   | `/api/parties`                    | required    | Create a party                    |
| GET    | `/api/parties/:id`                | member only | Party detail with members         |
| PATCH  | `/api/parties/:id`                | host only   | Update party                      |
| POST   | `/api/parties/:id/invites`        | member only | Generate an invite token          |
| GET    | `/api/invites/:token`             | public      | Invite preview (no auth needed)   |
| POST   | `/api/invites/:token/claim`       | required    | Claim invite, join the party      |
| POST   | `/images`                         | required    | Upload an image (multipart)       |
| GET    | `/images/:key/:size`              | session     | Stream an image variant           |

## Google OAuth

1. Open https://console.cloud.google.com/apis/credentials.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Authorized JavaScript origins:
   - Local: `http://localhost:5173`, `http://localhost:3001`
   - Prod:  the web service URL + the api service URL
4. Authorized redirect URIs:
   - Local: `http://localhost:3001/api/auth/callback/google`
   - Prod:  `<API_ORIGIN>/api/auth/callback/google`
5. Copy the client id + secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

When both are set the social provider lights up automatically. Until then, the dev-login route is the only way in (gated by `DEV_AUTH_ENABLED`).

## Image storage

The api writes uploaded covers as resized WebP variants (`<sha>_lg.webp`, `<sha>_sm.webp`) into the directory at `IMAGE_STORAGE_DIR`. Locally that's `./.data/images`. In production, mount a Railway volume at `/data/images` and set `IMAGE_STORAGE_DIR=/data/images`.

## Deploying to Railway

1. **Create services**:
   - Postgres (plugin)
   - `api` — connected to the repo
   - `web` — connected to the repo
2. **Volumes**: Attach a volume to `api` mounted at `/data/images`.
3. **Config**: For each service, set "Config-as-Code Path" to the matching `railway.toml`:
   - api → `apps/api/railway.toml`
   - web → `apps/web/railway.toml`
4. **Env vars**:

   `api`:
   | Var | Value |
   | ----------------- | ------------------------------------------- |
   | `DATABASE_URL`    | from the Postgres plugin                    |
   | `AUTH_SECRET`     | `openssl rand -base64 32`                   |
   | `AUTH_URL`        | the api service public URL                  |
   | `WEB_ORIGIN`      | the web service public URL                  |
   | `API_ORIGIN`      | the api service public URL                  |
   | `IMAGE_STORAGE_DIR` | `/data/images`                            |
   | `DEV_AUTH_ENABLED` | `0` (set `1` only for staging)             |
   | `GOOGLE_CLIENT_ID` | from Google Cloud Console                  |
   | `GOOGLE_CLIENT_SECRET` | from Google Cloud Console              |
   | `PORT`            | leave unset — Railway injects               |

   `web`:
   | Var | Value |
   | ----------------- | ------------------------------------------- |
   | `VITE_API_ORIGIN` | the api service public URL (build-time)     |
   | `PORT`            | leave unset                                 |

5. **Deploy**. On boot the api runs `prisma migrate deploy`, then starts.
