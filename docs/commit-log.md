# Commit log

Reverse chronological. Newest at top. Every meaningful commit gets an entry following the template at the bottom of this file.

---

## 2026-06-11 - feat: admin editing tools (accounts, members, tokens, force-stop, admins)

### Summary
The panel goes read-write against upstream-api-server's new editing surface:
create accounts (optional first owner, created via GoTrue when new), edit
name/slug inline, manage members (add by email w/ optional user creation,
role select, remove, one-time password-recovery links), issue/revoke agent
API tokens (one-time plaintext reveal), force-stop active sessions from the
stream detail page, and a new /admins page managing the platform_admins
allowlist (self-removal blocked server-side; "you" badge client-side).

### Files touched
- `src/app/(app)/accounts/create-account-form.tsx` — inline expanding create
  form in the accounts PageHeader; routes to the new account on success.
- `src/app/(app)/accounts/[accountId]/manage-cards.tsx` — IdentityCard
  (name/slug PATCH), MembersCard (add/role/remove/recovery link),
  TokensCard (issue with one-time plaintext + revoke).
- `src/app/(app)/accounts/[accountId]/account-detail-client.tsx` — wires the
  new cards; read-only members/tokens lists replaced.
- `src/app/(app)/streams/[sessionId]/stream-detail-client.tsx` —
  ForceStopButton on active sessions (confirm dialog, admin_forced).
- `src/app/(app)/admins/` — new page; sidebar gains an Admins item.
- `src/app/api/upstream/[...path]/route.ts` — FIX: bodyless statuses
  (204/205/304) must be piped without a body; the Response constructor
  throws otherwise, which turned every successful upstream DELETE into a
  proxy 500.
- `src/types/admin.ts` — token-create response, recovery link, platform
  admins shapes.

### Testing/checks
`npm run lint` + `npm run build` green. Full E2E through the panel proxy
against the local stack: create-with-new-owner, rename/slug, slug-conflict
409, member add/promote/last-owner-guard/remove, recovery link, token
create/revoke, platform-admin add/self-guard/remove, force-stop
(admin_forced + camera idle), and the audit log showing all ten actions.

---

## 2026-06-11 - restyle: dashboard-next design system, dark + gold

### Summary
Full visual port of upstream-dashboard's current design system (the
`.dashboard-next` look: solid shell with five drifting blurred orbs, frosted
sidebar rail + giant rounded frosted panel, solid tiles, Satoshi, custom
overlay scrollbar, cursor-proximity glow buttons) — recolored dark with the
gold accent (#d9a441) replacing creek green. Token/class NAMES are kept
identical to the source (`--dn-*` / `.dn-*`, scope class `.admin-panel`) so
recipes stay copy-compatible between the two repos; only values differ.

### Files touched
- `src/app/theme.css` — new; adapted copy of the dashboard's theme.css
  (dark tiles #211a11, warm off-white text, gold gradients, dimmed gold/
  bronze orbs, gold scrollbar thumb, reduced-motion guard kept).
- `src/app/fonts.ts` + `src/app/fonts/` — Satoshi (same files + license).
- `src/app/globals.css` — slimmed to resets; legacy glass theme deleted.
- `src/app/layout.tsx` — `.admin-panel` + Satoshi scope wrapper.
- `src/components/chrome/` — new; `shell-backdrop/cursor-glow/scroll-area`
  copied verbatim from the dashboard; `sidebar.tsx` (rail with admin nav +
  sign out) and `topbar.tsx` (avatar + greeting + wordmark) adapted; old
  `src/components/nav/topbar.tsx` deleted.
- `src/app/(app)/layout.tsx` — dashboard shell geometry (h-dvh, topbar,
  rail, `dn-panel` + ScrollArea); NotAuthorized/ApiUnavailable gates
  restyled as centered tiles. New `(app)/loading.tsx` + `(app)/error.tsx`
  per the dashboard's skeleton/error patterns.
- `src/components/data/*` — same APIs, dashboard-next recipes: new
  `status-dot.tsx` (halo dot), `status-badge` = dot + label, `data-table` =
  tile-wrapped table grammar, `stat-tile` = StatCard recipe, `page-header`
  with `.dn-grad-text` accent word, `empty-state` tile, copy-button tints.
- All page clients — class vocabulary swap (glass → dn-tile, ink → --dn-text
  vars, accent → gold, gold active filter pills, gold usage bars,
  `dn-grad-btn` save button); no data/logic changes.
- `(auth)/` — login on the orb shell in a `dn-glass-card` with `dn-field`
  pills and the `dn-grad-btn dn-glow-btn` cursor-glow submit.
- `README.md` — theme note updated.

### Testing/checks
`npm run lint` + `npm run build` green. Local run against the seeded stack:
all five pages 200 with the new chrome in the rendered HTML and zero legacy
class names; login/gate states render the new card styles.

---

## 2026-06-10 - fix: render API-unavailable diagnostic instead of crashing the shell

### Summary
Signing in against an API that lacks the `/v1/admin/*` surface (e.g. prod
before the api-server PR merges/deploys) made `(app)/layout.tsx` rethrow the
404 and Next rendered a generic "server error" page. The layout now renders
an ApiUnavailable card for any non-`not_platform_admin` failure, showing the
status/code and the two most likely causes (API not deployed with the admin
surface; wrong `NEXT_PUBLIC_UPSTREAM_API_URL`), with a sign-out button.

### Files touched
- `src/app/(app)/layout.tsx` — new `ApiUnavailable` component; catch-all
  error handling around the `/v1/admin/me` gate.

### Testing/checks
`npm run lint`, `npm run build` green. Reproduced against prod (404 on
/v1/admin/me) before the fix.

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
