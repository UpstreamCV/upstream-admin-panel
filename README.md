# upstream-admin-panel

Internal platform admin panel for Upstream: system health, cross-account
stream health, account/plan/limits management, usage reporting, and the admin
audit log. Consumes only the `/v1/admin/*` surface of
[upstream-api-server](../upstream-api-server) — this app never touches the
database.

**This is an internal tool.** There is no signup. Access requires a Supabase
Auth account that is on the `platform_admins` allowlist (enforced by the API
on every call; the UI gate is convenience only).

## Architecture

- Next.js 16 (App Router) + React 19 + Tailwind v4 — same stack and plumbing
  as `upstream-dashboard`, and the same design system: the dashboard-next
  look (orb shell, frosted rail/panel, tiles, Satoshi) recolored dark with the
  gold accent so an admin tab is visually distinct. Token/class names match
  the dashboard's `--dn-*`/`.dn-*` (scope class `.admin-panel`, values in
  `src/app/theme.css`).
- `proxy.ts` (Next middleware) refreshes the Supabase session and gates
  "signed in at all".
- `src/app/api/upstream/[...path]/route.ts` is a server-side proxy that mints
  the Supabase JWT and forwards **only** `/v1/admin/*` paths to the API — the
  panel cannot be used as a tunnel to tenant endpoints, and the browser never
  sees the access token.
- `(app)/layout.tsx` calls `GET /v1/admin/me`; a 403 `not_platform_admin`
  renders the not-authorized page.

## Pages

| Route | What it shows |
|---|---|
| `/` | System health tiles (API, DB, MediaMTX, processors) + streams-now summary |
| `/streams` | Every stream session across all tenants (state filter, 10 s poll) |
| `/streams/[id]` | Session detail: heartbeats, validations, processor status, reliability findings |
| `/accounts` | All tenants with member/device/live-stream counts (search + filters) |
| `/accounts/[id]` | Plan select, suspend/reactivate, limits editor (audited PATCHes), members, tokens, 30 d usage |
| `/usage` | Per-account `usage_events` totals with proportional bars (7/30/90 d) |
| `/audit-log` | Every admin mutation with before/after diff |

## Local development

```bash
# 1. Backend (in upstream-api-server):
supabase start && make db-reset
make dev-account                                  # seed tenant fixtures
make admin-seed EMAIL=admin@upstream.test         # or use --create, see script
make dev                                          # API on :4000

# 2. Panel:
cp .env.example .env.local                        # fill in local supabase anon key
                                                  # (`supabase status` in the api repo)
npm install
npm run dev                                       # http://localhost:3001
```

Local dev admin (created by the seed script with `--create`):
`admin@upstream.test`. A signed-in user who is NOT allowlisted sees the
not-authorized page — that's the expected state for dashboard users.

## Production

- Deploy: Netlify (`netlify.toml`), same three env vars as the dashboard:
  `NEXT_PUBLIC_UPSTREAM_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Builds scope).
- Seeding prod admins: migrations can't know prod user UUIDs. Either run
  `scripts/seed_platform_admin.py` in upstream-api-server with `.env` pointed
  at the hosted project, or insert directly in the Supabase SQL editor:
  `insert into platform_admins (user_id, note) values ('<auth.users id>', 'name');`

## Commit policy

Every commit updates `docs/commit-log.md` plus any relevant docs in the same
commit (Upstream-wide policy).
