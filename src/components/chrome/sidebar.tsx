"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import {
  Activity,
  BarChart3,
  Building2,
  LogOut,
  Radio,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

// Navigation rail — adapted from upstream-dashboard's sidebar-next.tsx.
// Same pill grammar: active item = solid tile pill with gold gradient label;
// inactive = faint translucent pill. Admin routes only; no coming-soon items.
const NAV: {
  label: string;
  href: string;
  match: RegExp;
  icon: LucideIcon;
}[] = [
  { label: "System", href: "/", match: /^\/$/, icon: Activity },
  { label: "Streams", href: "/streams", match: /^\/streams/, icon: Radio },
  { label: "Accounts", href: "/accounts", match: /^\/accounts/, icon: Building2 },
  { label: "Usage", href: "/usage", match: /^\/usage/, icon: BarChart3 },
  { label: "Audit log", href: "/audit-log", match: /^\/audit-log/, icon: ScrollText },
  { label: "Admins", href: "/admins", match: /^\/admins/, icon: ShieldCheck },
];

const ICON_SIZE = { width: "clamp(18px,1.6vw,22px)", height: "clamp(18px,1.6vw,22px)" };

export function Sidebar() {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  // Hard-redirect via window.location so the browser tosses every cached RSC
  // payload tied to the prior session (same posture as the dashboard).
  async function handleSignOut() {
    setSigningOut(true);
    try {
      const res = await fetch("/api/auth/sign-out", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
        return;
      }
      toast.error("Sign out failed. Try again.");
    } catch {
      toast.error("Sign out failed. Check your connection.");
    }
    setSigningOut(false);
  }

  return (
    <aside
      className="dn-rail dn-scroll hidden md:flex md:flex-col gap-1.5 px-3 py-4 sm:py-6 md:py-8 shrink-0 overflow-y-auto"
      style={{ width: "clamp(190px,17vw,244px)" }}
    >
      <nav className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active = item.match.test(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition",
                active
                  ? "bg-[var(--dn-tile)] shadow-sm"
                  : "bg-white/[0.04] hover:bg-white/[0.1]",
              )}
            >
              <Icon
                aria-hidden
                strokeWidth={2}
                className={clsx(
                  "shrink-0",
                  active ? "text-[var(--dn-creek-mid)]" : "text-white/70",
                )}
                style={ICON_SIZE}
              />
              <span
                className={clsx(
                  "truncate font-bold text-[clamp(0.9rem,1.05vw,1.05rem)]",
                  active ? "dn-grad-text" : "text-white/70",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.1] transition text-left disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LogOut
            aria-hidden
            strokeWidth={2}
            className="shrink-0 text-white/70"
            style={ICON_SIZE}
          />
          <span className="truncate font-bold text-[clamp(0.9rem,1.05vw,1.05rem)] text-white/70">
            {signingOut ? "Signing out…" : "Sign Out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
