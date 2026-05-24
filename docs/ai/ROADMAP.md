# ROADMAP

Thematic direction for **itin**. Not a dated commitment — use [TODO.md](TODO.md) for near-term execution.

## Product

### Calendar & activities (core next slice)

- Create and edit **activities** on the party calendar (time, title, location, notes)
- Vertical day view with real events (not just shell)
- Timezone-aware display using party `timezone`

### Social coordination

- **RSVP** or attendance per activity
- Member list visibility on activities
- Optional comments or notes per activity

### Invites & parties

- Invite expiry and revocation UI
- Host transfer
- Party settings (default timezone, cover image polish)

### Mobile / PWA

- Offline-friendly read-only calendar
- Push notifications for invites and activity changes
- Install prompt and icon polish

### Profiles

- Profile / settings (see [TODO.md](TODO.md)): photo, name, about, dietary & activity restrictions
- Display names on calendar and member lists

## Infrastructure

- GitHub Actions: `bun typecheck`, `bun lint`, optional test job
- Preview deployments (Railway or similar)
- Structured request logging and error reporting
- Staging environment with `DEV_AUTH_ENABLED=0` and Google OAuth only

## Explicitly later

- **Social network** (friends, feeds, public profiles, following) — **not planned for the near term**; trip coordination and calendar remain the product focus. Do not start this until explicitly prioritized after core calendar + profile work ships.
- Multi-tenant / org accounts
- Email magic links (Better Auth supports; product uses Google + dev login)
- Apple Sign In (schema mentions Apple; not configured)

When a theme becomes actionable, break out tasks into [TODO.md](TODO.md) **Now** or **Next**.
