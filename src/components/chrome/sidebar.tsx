"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

// Navigation rail — ported from upstream-dashboard's sidebar-next.tsx to the
// current hover-dock design. NO container: the button pills sit directly on the
// shell background. The rail collapses to an icon-only dock and expands to the
// full labelled width on HOVER (no toggle button). It's in-flow and widens on
// hover (.dn-rail-dock), so the content panel reflows to make room — the width
// transition slides it smoothly. Admin routes only; the active item is a solid
// GOLD pill (the admin's signature accent, kept per the brief) with a near-black
// icon + label — the counterpart of the dashboard's solid-white active pill.
//
// (Unlike the dashboard rail, the admin rail carries NO user-identity block —
// identity lives in the admin's separate <Topbar> above the rail/panel row.)
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

const ICON_SIZE = {
  width: "clamp(18px,1.6vw,22px)",
  height: "clamp(18px,1.6vw,22px)",
};

const ICON_SLOT = "3rem"; // fixed centered slot = collapsed rail content width

// The centered, fixed-width icon slot shared by every pill, so a collapsed icon
// is dead-centered (equal padding L/R) and never slides when the rail expands —
// the label simply cross-fades in beside it. That's what keeps the expand smooth
// and every pill identical in size.
function Slot({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="grid place-items-center shrink-0"
      style={{ width: ICON_SLOT }}
    >
      {children}
    </span>
  );
}

const ITEM_BASE = "flex items-center rounded-2xl py-2.5 transition-colors";
const LABEL_BASE =
  "font-bold text-[clamp(0.9rem,1.05vw,1.05rem)] truncate min-w-0 pr-3";

// Rail expand state, tracked at MODULE scope so it survives the rail remounting
// on navigation. The expand is JS-driven (not just CSS :hover) because after a
// client-side navigation the browser won't re-apply :hover to a freshly-mounted
// rail under a STATIONARY cursor — so clicking a nav item would otherwise
// auto-collapse the rail on the new page until you wiggle the mouse.
let railOpen = false;
let lastPointer: { x: number; y: number } | null = null;

export function Sidebar() {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  // Seed from the persisted module flag so a remounted rail paints already-open
  // (no collapse flash) when the cursor is still over it after navigating.
  const [open, setOpen] = useState(() => railOpen);

  // Single source of truth for the expand: the pointer is inside the rail's
  // CURRENT box (collapsed 3.75rem or expanded). Natural hysteresis — entering
  // the narrow rail opens it; you stay open until you leave the WIDE rail. Runs
  // on every move and is re-evaluated on each route change from the last known
  // pointer, so it's correct even when the browser won't re-fire :hover.
  useEffect(() => {
    const evaluate = (x: number, y: number) => {
      const el = asideRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      if (inside !== railOpen) {
        railOpen = inside;
        setOpen(inside);
      }
    };
    const onMove = (e: MouseEvent) => {
      lastPointer = { x: e.clientX, y: e.clientY };
      evaluate(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    if (lastPointer) evaluate(lastPointer.x, lastPointer.y);
    return () => window.removeEventListener("mousemove", onMove);
  }, [pathname]);

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

  function itemCls(active: boolean) {
    return clsx(
      ITEM_BASE,
      active
        ? "bg-[var(--dn-creek-mid)] shadow-sm"
        : "bg-white/[0.06] hover:bg-white/[0.12]",
    );
  }
  // Labels stay in the DOM (so the icon never reflows) but are clipped by the
  // rail's overflow-x-hidden and faded out; on hover they cross-fade in as the
  // rail widens.
  function labelCls(color: string) {
    return clsx(
      LABEL_BASE,
      "opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-data-[open=true]:opacity-100",
      color,
    );
  }

  return (
    // Tight symmetric px-1.5 (6px) margin: the icon-slot is centered in the
    // 3.75rem dock. Top padding matches the panel's content padding so the first
    // pill lines up with the panel's first content row.
    <aside
      ref={asideRef}
      data-open={open ? "true" : "false"}
      className="dn-rail-dock dn-scroll group hidden md:flex md:flex-col gap-1.5 px-1.5 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 shrink-0 overflow-x-hidden overflow-y-auto"
    >
      <nav className="flex flex-col gap-1.5">
        {NAV.map((item) => {
          const active = item.match.test(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={itemCls(active)}
              title={item.label}
              aria-label={item.label}
            >
              <Slot>
                <Icon
                  aria-hidden
                  strokeWidth={2}
                  className={clsx(
                    "shrink-0",
                    // Active pill is solid gold → near-black icon + label.
                    active ? "text-[#1c1610]" : "text-white/80",
                  )}
                  style={ICON_SIZE}
                />
              </Slot>
              <span className={labelCls(active ? "text-[#1c1610]" : "text-white/80")}>
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
          title="Sign Out"
          aria-label="Sign Out"
          className={clsx(
            itemCls(false),
            "text-left disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          <Slot>
            <LogOut
              aria-hidden
              strokeWidth={2}
              className="shrink-0 text-white/80"
              style={ICON_SIZE}
            />
          </Slot>
          <span className={labelCls("text-white/80")}>
            {signingOut ? "Signing out…" : "Sign Out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
