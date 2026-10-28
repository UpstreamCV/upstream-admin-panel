# Commit log

Reverse chronological. Newest at top. Every meaningful commit gets an entry following the template at the bottom of this file.

---

## 2026-10-27 - chore: stop Dependabot version updates

### Summary
The project is finished and published for reference, so nobody is
left to review automated dependency-update PRs. Removes
`.github/dependabot.yml`; the open Dependabot PRs are closed.

- `.github/dependabot.yml` — deleted.
- `docs/commit-log.md` — this entry; stray leading space removed from the LICENSE entry.

---

## 2026-10-27 - chore: add all-rights-reserved LICENSE

### Summary
Adds `LICENSE` ahead of making the repo public: copyright
Upstream Vision, Inc., all rights reserved. The source is visible for
reference only; no rights to use, copy, modify, or distribute it are
granted. Third-party components keep their own licenses.

- `LICENSE` (new).
- `docs/commit-log.md` — this entry.

---

## 2026-07-15 - refactor: System is a single tab-less page (revert the System split)

### Summary
Per follow-up: the System page should show everything on one scrolling
page with NO tabs (matching the dashboard's tab-less Home). Reverts the
prior commit's System split — the three tab clients recombine into one
`system-health-client` (health tiles + activity graphs + server-sampled
strip + control-plane counters + streams-now + drill-in), and the
`(system)` route group drops its `SectionTabs` `layout.tsx` and the
`/system/activity` + `/system/control-plane` sub-routes. `(system)` now
mirrors the dashboard's `(home)` group: `page.tsx` + a tab-less
`loading.tsx`, no layout. The other sections (Traffic, Governance) and the
detail-page tabs are unchanged.

### Files touched
- `src/app/(app)/(system)/system-health-client.tsx` — recombined client.
- `src/app/(app)/(system)/page.tsx` — renders it.
- removed `(system)/layout.tsx`, `(system)/overview-client.tsx`, and the
  `(system)/system/{activity,control-plane}/` subtree.
- `src/components/chrome/sidebar.tsx` — System `match` narrowed to `^/$`.

### Testing/checks
`tsc --noEmit` passes clean; PR CI gate (eslint + `next build`) verifies.

---

## 2026-07-15 - refactor: restructure pages to match the dashboard architecture

### Summary
The admin chrome was re-skinned to the dashboard's theme, but its PAGE
architecture still lagged: 6 flat rail pages, zero tabs, a uniform fixed
panel for every route, and one global loading skeleton. This restructures
the admin to be architecturally identical to `upstream-dashboard`, keeping
admin content + the gold/orange accent. All URLs are unchanged (route
groups add no segment); this is mostly file moves + new group layouts +
splitting the fat clients into per-tab clients. No data-layer, auth-gate,
or proxy changes.

What changed to match the dashboard:
- **Home-scroll shell**: new `AppShell` (client, pathname-aware) — Home
  (`/`) scrolls with the panel rising over the tools; every other page is
  a fixed panel with internal scroll. Identity moved OFF the topbar INTO
  the rail (avatar + greeting, sized to `--dn-topbar-h`); the topbar became
  tools-only (`TopbarTools`: search + "Upstream Admin" + logo), rendered
  inside the panel on Home.
- **4-section rail**: `Sidebar` NAV regrouped into System / Traffic /
  Accounts / Governance, each with a widened `match` regex; active pill is
  the solid gold pill.
- **Route groups + SectionTabs**: pages regrouped into `(system)`,
  `(traffic)`, `(accounts)`, `(governance)`. Each group's `layout.tsx`
  renders a shared `SectionTabs` strip; each group's `loading.tsx` renders
  a content-only `SectionContentSkeleton` BELOW the strip, so the strip
  persists across tab nav while only content reloads.
- **System split into tabs**: the one long `system-health-client` became
  Overview (`/`, the scrolling Home), Activity (`/system/activity`),
  Control plane (`/system/control-plane`).
- **Tabbed detail pages (two-level nav)**: stream detail →
  Overview / Validations / Reliability; account detail → Plan / Usage /
  Members / Limits / Tokens. Each is a real sub-route with a persistent
  header (in the detail `layout.tsx`) + its own loading skeleton. Detail
  clients fetch the same key the header does — SWR dedupes.

New primitives: `components/data/section-tabs.tsx`,
`components/data/section-content-skeleton.tsx`,
`components/chrome/app-shell.tsx`.

### Files touched
- `src/components/chrome/{app-shell,sidebar,topbar}.tsx` — home-scroll
  shell, identity-in-rail + 4-section nav, tools-only topbar.
- `src/components/data/{section-tabs,section-content-skeleton}.tsx` — new.
- `src/app/(app)/layout.tsx` — renders `<AppShell>`; derives rail `name`.
- `src/app/(app)/(system|traffic|accounts|governance)/…` — moved pages +
  group `layout.tsx`/`loading.tsx`; System split into Overview/Activity/
  Control-plane clients; stream + account detail split into tab routes
  with persistent detail headers.

### System interaction notes
Presentation/routing only. Auth gate (`/v1/admin/me`), `serverFetch`,
`useUpstreamList`, the `/api/upstream` proxy, and `proxy.ts` matcher are
untouched (route groups keep every URL identical). No account scoping —
the admin stays single-tenant.

### Testing/checks
`tsc --noEmit` / `npm run lint` / `npm run build` — run against a heavily
loaded machine; the PR's CI gate (eslint + `next build`) is the source of
truth for green. Static checks: no dangling imports to the removed
`system-health-client` / `stream-detail-client` / `account-detail-client`;
exactly one `page.tsx` resolves to `/`.

### Follow-up TODOs
- Home (`/`) now carries the System SectionTabs strip (intentional
  divergence from the dashboard's tab-less home — a consequence of
  "Home scrolls" + "System is tabbed").
- Section/tab names (Traffic, Governance) are placeholders — adjust freely.

---

## 2026-07-15 - style: re-sync admin chrome to the dashboard's current dark redesign

### Summary
The admin panel's chrome was ported from an OLD version of
upstream-dashboard's `.dashboard-next` design system; the dashboard has
since been re-skinned (2026-06-15 "DarkMode" redesign). This re-syncs the
admin shell to that current look so it feels like the live product
dashboard — while KEEPING the admin's signature gold/orange accent
(`--dn-creek-mid: #d9a441`) per request. Changes are chrome-only; no page
logic, data, or routes touched.

What changed to match the dashboard:
- **Side panel**: the fixed, container-boxed rail became a NO-container
  hover-expand icon dock (`.dn-rail-dock`) — collapses to centered icons,
  expands to the labelled rail on hover with a smooth width transition
  that reflows the content panel. JS-driven open state (module-scoped
  `railOpen` + pointer hit-test) so it stays open after a nav click under
  a stationary cursor. Active pill is a solid GOLD pill (near-black
  icon/label) — the brand counterpart of the dashboard's white pill.
- **Animations**: orbs now drift on JS-driven RANDOM targets (eased by a
  20s CSS transition) instead of fixed CSS keyframe loops; added the
  dashboard's film-grain overlay; glass buttons (`.dn-glow-soft`) gained
  the always-on frost + magnetic cursor lean (`--dn-tx/--dn-ty`) +
  hover-only gold sheen, replacing the old proximity glow.
- **Panel/surfaces**: `.dn-panel` became the frosted black-scrim + subtle
  white stroke (was a white-alpha fill + gold stroke); tiles use the
  dashboard's inset-rim shadow. Added `--dn-*` parity tokens (status
  accents, `--dn-tab-fill`, `--dn-base`, radii) and parity classes
  (`.dn-card`, `.dn-tab*`, `.dn-panel-square`).
- **Chrome fix**: backdrop-filter values are now wrapped in
  `var(--bf-…, <value>)` so Tailwind v4's Lightning CSS can't strip the
  unprefixed property (Chrome silently drops the blur otherwise) — same
  guard the dashboard + upstream-web use.

### Files touched
- `src/app/theme.css` — full re-sync to the current dashboard system
  (gold-tinted): dock rail, frosted scrim panel, JS-drift orbs + grain,
  magnetic glass buttons, `var(--bf-…)` guards, parity tokens/classes.
- `src/components/chrome/shell-backdrop.tsx` — now a client component that
  hands each orb a fresh random target on a jittered interval (ported).
- `src/components/chrome/cursor-glow.tsx` — magnetic-lean + hover-sheen
  controller (`--dn-tx/--dn-ty`, `--mx/--my`), hover-gated (ported).
- `src/components/chrome/sidebar.tsx` — hover-expand icon-dock rail (admin
  nav, gold active pill, no identity block — identity stays in Topbar).
- `src/app/(app)/layout.tsx` — dropped the rail↔panel gap so the dock
  reflow physics read; refreshed the header comment.

### System interaction notes
Presentation only. The auth gate (`/v1/admin/me`), proxy, `serverFetch`,
and every page component are unchanged; the reskin is confined to the
`.admin-panel` theme scope + the three chrome components + the shell
layout wiring.

### Testing/checks
`npx tsc --noEmit`, `npm run lint`, `npm run build`.

### Follow-up TODOs
- Admin has no SectionTabs today; `.dn-tab*` / `.dn-card` ship for recipe
  parity with the dashboard and are unused until a tabbed admin section
  lands.

---

## 2026-06-11 - fix: NaN tiles under API version skew + API runtime params

### Summary
The previous commit assumed the deployed API already returned the new
timeseries fields; against the still-undeployed production API the new
graph tiles summed `undefined` and rendered NaN. Skew is structural
(Netlify auto-deploys the panel on push; the API deploys manually on
EC2), so the panel now treats the new fields as optional: `?? 0` /
`?? null` at every use, and the spark components coerce non-finite
values to gaps/empty slots as a last line of defense.

Also renders the API's new `runtime` health params on the API tile —
"v0.x · production · up 2d 3h · 142 MB · load 0.12" — fields appear as
the deployed API starts reporting them.

### Files touched
- `src/types/admin.ts` — timeseries new fields optional; `api.runtime`.
- `src/app/(app)/system-health-client.tsx` — null-coalesced sums/spark
  inputs; API tile hint composes runtime params.
- `src/components/data/spark.tsx` — AreaSpark/BarSpark sanitize
  non-finite input.

### Testing/checks
`npx tsc --noEmit`, `npm run lint`, `npm run build` all green.

---

## 2026-06-11 - feat: control-plane tiles + alerts/workflows/detections graphs

### Summary
System page reads the API's new control-plane counter snapshot
(`GET /v1/admin/system/metrics`, the parsed view of the in-process
Prometheus registry from M9.3) and the four new hourly timeseries.
Activity history grows from 4 to 8 graphs: Alerts fired, Workflow runs,
Objects detected, Detection confidence (nullable — gaps mean no
detections, not zero confidence), all on the existing 24h/3d/7d
switcher. New "Control plane" section: Ingest webhooks (ok/4xx/5xx,
red dot on any 5xx), Stream auth (allowed/denied, yellow on denial),
Time to streaming (p95 vs the 8 s SLI from observability doc 01 §5),
Sessions failed (of total transitions, plus db pool in-use/size). The
section header shows "counters since API restart · up Xd Yh" because
the registry resets on restart — also a cheap restart detector. Tiles
render "…"/— until the API ships the endpoint (404s degrade quietly).

### Files touched
- `src/types/admin.ts` — `ControlPlaneMetrics`; `SystemTimeseries`
  points gain alerts_fired, workflow_runs, objects_detected,
  avg_detection_confidence.
- `src/app/(app)/system-health-client.tsx` — metrics fetch (15 s
  refresh), 4 new GraphTiles, Control plane StatTile section,
  `formatUptime`.

### Testing/checks
`npx tsc --noEmit`, `npm run lint`, `npm run build` all green.
Requires upstream-api-server commit "feat(admin): control-plane
metrics endpoint + richer system timeseries" deployed for live data.

---

## 2026-06-11 - chore: real favicon set

### Summary
Installs the favicon.io package (ico + 16/32 png + apple-touch +
android-chrome 192/512) into public/, fills in site.webmanifest with the
panel's name and dark theme colors (#1c1610), and wires metadata.icons +
manifest in the root layout (same shape as the dashboard's).

### Files touched
- `public/*` — icon assets + site.webmanifest.
- `src/app/layout.tsx` — metadata.icons + manifest.

### Testing/checks
`npm run build` green.

---

## 2026-06-11 - feat: graphs read server-collected health history

### Summary
The DB-latency graph no longer builds a per-tab client ring buffer — the
API now samples itself (in-process loop, system_health_samples table) and
the panel reads GET /v1/admin/system/health/history. Adds two more tiles
from the same samples: Component uptime (UptimeStrip — gold ok / yellow
MediaMTX-unreachable / red down, with an uptime %% headline) and Active
sessions over the last hour. The browser still polls once a minute to
refresh the view, but it no longer drives the probes, and history is shared
across tabs / exists while nobody is watching.

### Files touched
- `src/components/data/spark.tsx` — UptimeStrip.
- `src/app/(app)/system-health-client.tsx` — history fetch replaces the
  ring buffer; three server-sampled tiles.
- `src/types/admin.ts` — HealthHistory.

### Testing/checks
`npm run lint` + `npm run build` green; live with a 5 s sampler interval
the history endpoint served server-collected samples and the page rendered
all three tiles.

---

## 2026-06-11 - feat: system health graphs (sparklines, no chart lib)

### Summary
The System page gains an "Activity history" section — four graph tiles
(sessions started, validation failures, streaming minutes, avg FPS) over a
24h/3d/7d range picker, backed by the API's new /v1/admin/system/timeseries
hourly buckets — plus a live DB-latency sparkline fed by the existing 15s
health poll (client-side ring buffer; this-tab only, since latency history
isn't persisted). Stream detail gets FPS and bitrate sparklines computed
from the heartbeats the page already fetches. Charts are hand-rolled SVG
(AreaSpark handles null gaps by breaking the line rather than interpolating
to zero; BarSpark renders zero-hours as 1px stubs) — the no-chart-library
decision stands.

### Files touched
- `src/components/data/spark.tsx` — new: AreaSpark, BarSpark, GraphTile.
- `src/app/(app)/system-health-client.tsx` — Activity history section,
  range picker, latency ring buffer.
- `src/app/(app)/streams/[sessionId]/stream-detail-client.tsx` — FPS +
  bitrate sparklines above the heartbeats table.
- `src/types/admin.ts` — SystemTimeseries.

### Testing/checks
`npm run lint` + `npm run build` green; live against the local stack the
timeseries endpoint returned 24 zero-filled buckets with real data in the
active hour, and the System page renders all five graph tiles.

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
