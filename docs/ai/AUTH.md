# Sign-in options

Production users should use one of:

- **Google** — when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set
- **Email + password** — `POST /api/email/sign-up` or sign-in via the Sign-in page
- **Phone + password** — OTP verification on sign-up, then phone + password for later sign-ins

**Dev-only:** `POST /api/dev-login` when `DEV_AUTH_ENABLED=1`. Hidden behind a collapsible on the Sign-in page. It creates a deterministic dev email account with a password (not name-only).

## Phone OTP in development

The API logs OTP codes to the terminal running `bun dev` (see `apps/api/src/auth/phone-otp.ts`). Use international format: `+1…`, `+506…`, etc.

## Config endpoint

```sh
curl -s http://localhost:3001/api/auth/config | jq .
# { "google": bool, "devAuth": bool, "emailPassword": true, "phone": true }
```

## REST examples

See repo root [`rest.http`](../../rest.http) for email, phone, and Google flows.

## Google OAuth

See [GOOGLE-OAUTH.md](GOOGLE-OAUTH.md).
