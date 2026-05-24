# @itin/api

Hono on Bun. Better Auth + Prisma + Postgres.

## Routes

| Method | Path                              | Auth        | Description                       |
| ------ | --------------------------------- | ----------- | --------------------------------- |
| GET    | `/health`                         | none        | Liveness check                    |
| GET    | `/api/auth/config`                | none        | Which sign-in methods are enabled |
| ANY    | `/api/auth/**`                    | varies      | Better Auth handler (owns this namespace) |
| POST   | `/api/email/sign-up`              | none        | Create account (email + password) |
| POST   | `/api/email/sign-in`              | none        | Sign in with email + password     |
| POST   | `/api/phone/send-otp`             | none        | Send SMS OTP (logged in dev)      |
| POST   | `/api/phone/sign-up`              | none        | Verify OTP, set password, sign in |
| POST   | `/api/phone/sign-in`              | none        | Sign in with phone + password     |
| POST   | `/api/dev-login`                  | dev-only    | Dev sign-in (creates email account) |
| GET    | `/api/me`                         | optional    | Current session user (or `null`)  |
| PATCH  | `/api/me`                         | required    | Update name and profile image key |
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

When both are set the social provider lights up automatically. Email/password and phone OTP sign-up are always available. Dev-login (`DEV_AUTH_ENABLED=1`) is for local testing only and still creates a real email+password account under the hood.

### Phone OTP (dev)

OTP codes are printed to the API process stdout. Use E.164 format (e.g. `+15551234567`). Phone sign-up verifies the code, sets a password, then updates the user's name.

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
