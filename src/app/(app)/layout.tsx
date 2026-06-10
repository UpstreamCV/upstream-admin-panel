import { Topbar } from "@/components/nav/topbar";
import { serverFetch } from "@/lib/api/server";
import { UpstreamApiError } from "@/lib/api/errors";
import type { AdminMe } from "@/types/admin";

function NotAuthorized() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="glass rounded-3xl p-8 max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-accent mono">
          upstream / admin
        </p>
        <h1 className="display text-2xl font-semibold mt-3">
          Not <em>authorized</em>
        </h1>
        <p className="text-sm text-ink-soft mt-3">
          You&rsquo;re signed in, but this account is not a platform admin.
          Ask an existing admin to add you to the allowlist
          (<span className="mono">make admin-seed EMAIL=…</span> in
          upstream-api-server).
        </p>
        <form action="/api/auth/sign-out" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-full border border-glass-stroke px-4 py-2 text-sm text-ink-soft hover:text-ink hover:bg-white/5 transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

// Authed shell. The proxy middleware already guarantees a Supabase session;
// this layout additionally requires platform-admin status via /v1/admin/me.
// This is UX-only gating — real enforcement is current_platform_admin on
// every API call.
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
    throw err;
  }

  return (
    <div className="min-h-dvh p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <Topbar email={me.email} />
      <main>{children}</main>
    </div>
  );
}
