# Google OAuth — setup and testing

Google is optional. Users can also **create an account** with email/password or phone (OTP + password) on `/signin`. See [AUTH.md](AUTH.md).

## 1. Google Cloud Console

1. Open https://console.cloud.google.com/apis/credentials (pick or create a project).
2. **OAuth consent screen** — configure if prompted (External is fine for dev; add your email as a test user while in "Testing").
3. **Create credentials** → **OAuth 2.0 Client ID** → type **Web application**.

### Authorized JavaScript origins

| Environment | URL |
| --- | --- |
| Local web | `http://localhost:5173` |
| Local API (optional) | `http://localhost:3001` |

### Authorized redirect URIs

| Environment | URL |
| --- | --- |
| Local | `http://localhost:3001/api/auth/callback/google` |
| Production | `https://<your-api-host>/api/auth/callback/google` |

The redirect goes to the **API** origin, not the Vite port. In dev, Vite proxies `/api` to the API.

4. Copy **Client ID** and **Client secret**.

## 2. API environment

In `apps/api/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# Already required for auth
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3001
API_ORIGIN=http://localhost:3001
WEB_ORIGIN=http://localhost:5173
```

Restart the API after changing env (`bun dev`).

## 3. Verify config endpoint

```sh
curl -s http://localhost:3001/api/auth/config | jq .
# Expect: { "google": true, "devAuth": true, "emailPassword": true, "phone": true }
```

Or: **Run Task** → `api: auth config → side panel`.

## 4. Test in the browser

1. `bun dev` — web on http://localhost:5173, API on http://localhost:3001.
2. Open http://localhost:5173/signin
3. **Create account** or **Sign in** with email or phone, or use **Continue with Google** when `google: true`.
4. Complete sign-in → land on `/parties` with a session.
5. Tap your **profile avatar** (top right) → **Profile** → confirm name/email; upload a photo; **Save**.
6. **Sign out** on the profile page → back to sign-in.

## 5. Troubleshooting

| Sym redirect_uri_mismatch | Redirect URI in Google Console must exactly match `http://localhost:3001/api/auth/callback/google` |
| No Google button | `google: false` — check client id/secret and restart API |
| Session missing after OAuth | `WEB_ORIGIN` must be `http://localhost:5173`; cookies are set for the API origin and proxied in dev |
| Works locally, not prod | Set Railway env vars; redirect URI must use production API URL |

See also [apps/api/README.md](../../apps/api/README.md) and [SETUP-TROUBLESHOOTING.md](SETUP-TROUBLESHOOTING.md).
