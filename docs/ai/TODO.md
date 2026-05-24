# TODO

Actionable backlog for humans and agents. Keep **Now** to one or two items.

## Now

_(empty — pick from **Next** or user direction)_

## Next

- [ ] **Profile / settings (remaining)** — extend `/settings`:
  - Change password (Google-only users: optional “set password” or hide when OAuth-only)
  - **About** — free-text bio
  - **Dietary restrictions** — user-level prefs (schema + API + form)
  - **Activity restrictions** — e.g. mobility, allergies, time limits (schema + API + form)
  - Persist on `User` (or `UserProfile` table); Zod schemas in `@itin/shared`
- [ ] Calendar activities (create, edit, display on day view)
- [ ] RSVP / attendance per activity
- [ ] CI: typecheck + lint on PRs

## Done

- [x] **Google OAuth login** — [GOOGLE-OAUTH.md](GOOGLE-OAUTH.md); Sign-in UI; dev login when `DEV_AUTH_ENABLED`
- [x] **Profile / settings (baseline)** — `/settings`, avatar in header, `PATCH /api/me`, photo upload, sign out
- [x] **AI vibe coding infra** — `AGENTS.md`, `docs/ai/*`, `docs/standups/*`, `.cursor/rules/vibe-coding.mdc`

## Google OAuth — acceptance criteria (reference)

- [x] Sign-in shows **Continue with Google** when API reports `google: true`
- [x] Uses Better Auth routes under `/api/auth/*`
- [x] Post-login redirect matches dev login (`next`, pending invite)
- [x] Dev login remains when `DEV_AUTH_ENABLED`
- [x] Manual test: set Google credentials in `apps/api/.env`, redirect URI `http://localhost:3001/api/auth/callback/google`
