import { AppShell } from "@/components/chrome/app-shell";
import { CursorGlow } from "@/components/chrome/cursor-glow";
import { ShellBackdrop } from "@/components/chrome/shell-backdrop";
import { TopbarTools } from "@/components/chrome/topbar";
import { serverFetch } from "@/lib/api/server";
import { UpstreamApiError } from "@/lib/api/errors";
import type { AdminMe } from "@/types/admin";

function GateCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dn-shell-bg relative min-h-dvh overflow-hidden grid place-items-center p-6">
      <ShellBackdrop />
      <div className="dn-tile relative z-10 w-full max-w-md text-center p-8">
        <p className="text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)]">
          upstream / admin
        </p>
        <h1 className="mt-3 font-bold text-[clamp(1.4rem,2vw,1.8rem)]">
          {title} <span className="dn-grad-text">{accent}</span>
        </h1>
        {children}
        <form action="/api/auth/sign-out" method="post" className="mt-6">
          <button
            type="submit"
            className="dn-btn dn-glow-soft px-5 py-2 text-sm font-bold"
          >
            <span className="relative z-10">Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function NotAuthorized() {
  return (
    <GateCard title="Not" accent="authorized">
      <p className="mt-3 text-sm text-[var(--dn-text-50)]">
        You&rsquo;re signed in, but this account is not a platform admin. Ask
        an existing admin to add you to the allowlist
        (<span className="font-mono">make admin-seed EMAIL=…</span> in
        upstream-api-server).
      </p>
    </GateCard>
  );
}

function ApiUnavailable({ detail }: { detail: string }) {
  return (
    <GateCard title="API" accent="unavailable">
      <p className="mt-3 text-sm text-[var(--dn-text-50)]">
        You&rsquo;re signed in, but the panel couldn&rsquo;t reach a compatible
        Upstream API. Most common causes: the API hasn&rsquo;t been deployed
        with the <span className="font-mono">/v1/admin/*</span> surface yet,
        or <span className="font-mono">NEXT_PUBLIC_UPSTREAM_API_URL</span>{" "}
        points at the wrong origin.
      </p>
      <p className="mt-4 text-xs font-mono text-[var(--dn-text-50)]">{detail}</p>
    </GateCard>
  );
}

// Authed shell — the dashboard's current dark chrome (gold variant): a warm
// dark shell with JS-driven drifting orbs + film grain, the identity topbar on
// the shell, a hover-expand icon-dock rail (Sidebar) that reflows the content
// panel, and a giant frosted panel whose content scrolls inside ScrollArea. The
// proxy middleware guarantees a Supabase session; this layout additionally
// requires platform-admin status via /v1/admin/me (UX-only — real enforcement
// is current_platform_admin on every API call).
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let me: AdminMe;
  try {
    me = await serverFetch<AdminMe>("/v1/admin/me");
  } catch (err) {
    if (err instanceof UpstreamApiError && err.code === "not_platform_admin") {
      return <NotAuthorized />;
    }
    if (err instanceof UpstreamApiError) {
      return <ApiUnavailable detail={`${err.status} ${err.code}: ${err.message}`} />;
    }
    return (
      <ApiUnavailable detail={err instanceof Error ? err.message : String(err)} />
    );
  }

  // Identity for the rail's greeting block (identity moved OFF the topbar into
  // the rail, mirroring the dashboard). The per-route chrome arrangement lives
  // in <AppShell> (a Client Component reading the pathname): on Home the panel
  // scrolls over the tools; elsewhere the panel is fixed with internal scroll.
  const name = me.email?.split("@")[0] ?? "admin";

  return (
    // h-dvh + overflow-hidden locks the shell to exactly the viewport so the
    // chrome stays put and only the content area scrolls — same geometry as the
    // dashboard's (app) layout.
    <div className="dn-shell-bg relative h-dvh overflow-hidden">
      <ShellBackdrop />
      <CursorGlow />
      <AppShell name={name} tools={<TopbarTools />}>
        {children}
      </AppShell>
    </div>
  );
}
