// Top bar — adapted from upstream-dashboard's topbar-next.tsx. Sits directly
// on the dark shell (no panel). Left: gold avatar + greeting; right: wordmark.
// Server Component (display-only); the (app) layout passes `email` down from
// the /v1/admin/me gate. The dashboard's unwired search field is dropped.
export function Topbar({ email }: { email: string | null }) {
  const name = email?.split("@")[0] ?? "admin";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between gap-4 px-1 sm:px-3 py-1">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <span
          className="grid place-items-center rounded-full bg-[var(--dn-creek-mid)] text-[#1c1610] font-bold shrink-0"
          style={{
            width: "clamp(40px,4.4vw,64px)",
            height: "clamp(40px,4.4vw,64px)",
            fontSize: "clamp(1rem,1.6vw,1.5rem)",
          }}
          aria-hidden
        >
          {initial}
        </span>
        <h1 className="truncate text-white font-bold text-[clamp(1.15rem,2.2vw,2rem)]">
          Welcome back, <span className="capitalize">{name}</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <span className="hidden sm:inline text-white/80 font-bold text-[clamp(1.05rem,2vw,1.85rem)] whitespace-nowrap">
          Upstream <span className="dn-grad-text">Admin</span>
        </span>
      </div>
    </header>
  );
}
