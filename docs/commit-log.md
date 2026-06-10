# Commit log

Reverse chronological. Newest at top. Every meaningful commit gets an entry following the template at the bottom of this file.

---

## 2026-06-10 - feat: initial admin panel (scaffold + all v1 pages)

### Summary
First commit of the platform admin panel. Skeleton lifted from
upstream-dashboard (proxy middleware, server-side API proxy, Supabase auth,
data components, dark glass theme) and trimmed to the admin use case; all v1
pages implemented against upstream-api-server's `/v1/admin/*` surface.

### Files touched
- `proxy.ts` — session-refresh middleware; only `/login` is public.
- `src/app/api/upstream/[...path]/route.ts` — server-side proxy; forwards
  ONLY `/v1/admin/*` (the panel can't be used as a tunnel to tenant
  endpoints); mints the Supabase JWT server-side.
- `src/app/(auth)/login/*` — password login (no signup; allowlist-only).
- `src/app/(app)/layout.tsx` — admin gate via `GET /v1/admin/me`; 403 renders
  the not-authorized page with sign-out.
- `src/app/(app)/page.tsx` + `system-health-client.tsx` — health tiles +
  streams-now summary (15 s poll).
- `src/app/(app)/streams/*` — cross-account session table (state filter,
  `?account=` deep link, 10 s poll) + session detail (heartbeats,
  validations, processor statuses, reliability findings).
- `src/app/(app)/accounts/*` — tenant list (search/status filters) + detail
  with plan select, suspend/reactivate (confirm dialog), limits editor —
  all PATCHes audited server-side.
- `src/app/(app)/usage/*` — per-account usage totals with proportional CSS
  bars, 7/30/90 d presets. No charts library by design.
- `src/app/(app)/audit-log/*` — paginated audit entries with computed
  before/after diff summaries.
- `src/components/data/*` — DataTable, StatusBadge, PageHeader, EmptyState,
  RelativeTime, CopyButton lifted from the dashboard; new StatTile.
- `src/lib/*` — env (zod-validated), api client/server fetchers (account
  scoping removed — admin calls are cross-tenant), supabase clients,
  safe-next, time, error.
- `src/types/admin.ts` — TS mirrors of the API's platform_admin schemas.
- `src/app/globals.css` — dashboard glass theme with amber accent (admin
  tabs visually distinct from the operator dashboard).
- `netlify.toml`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
  `postcss.config.mjs`, `.env.example`, `README.md`.

### System interaction notes
`browser → /api/upstream/v1/admin/* (Next route handler, cookie session →
Bearer JWT) → upstream-api current_platform_admin → handler`. Mutations
surface toasts and re-fetch via SWR mutate; the API writes the audit row in
the same transaction as the change.

### Testing/checks
`npm run lint` and `npm run build` green; full E2E against the local stack
(login as seeded admin, all pages render seeded data, PATCH plan/limits →
audit entries appear, non-admin sees not-authorized page).

### Strict non-goals
- No member/token mutations (read-only in v1).
- No Stripe/billing — usage is ledger reporting only.
- No charts library.

---

## Template

Copy this block for each new entry. Put new entries at the top of the file, not the bottom.

```markdown
## YYYY-MM-DD - Short commit title

### Summary
One paragraph: what changed and why.

### Files touched
- `path/to/file.py` — what changed.

### System interaction notes
How this change moves through the request flow.

### Testing/checks
What was run and what passed; what could not be run and why.

### Follow-up TODOs
What this commit deferred.
```
