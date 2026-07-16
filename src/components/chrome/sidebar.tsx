"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import {
  Activity,
  Building2,
  LogOut,
  Radio,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

// Navigation rail — ported from upstream-dashboard's sidebar-next.tsx. NO
// container: the button pills sit directly on the shell background. The rail
// collapses to an icon-only dock and expands to the full labelled width on HOVER
// (no toggle button). It's in-flow and widens on hover (.dn-rail-dock), so the
// content panel reflows to make room. The rail carries the admin IDENTITY block
// at its top-left (avatar + greeting), sized to the top tools-row height
// (--dn-topbar-h) so the first nav button top-aligns with the content panel.
//
// The rail holds the FOUR top-level SECTIONS of the admin IA (System, Traffic,
// Accounts, Governance); each section's sub-areas live in a per-section
// SectionTabs strip (rendered by the section's route-group layout), never in the
// rail — this keeps the hover-dock physics untouched (uniform pills, no
// accordion). Each section's `match` is widened to cover all of its leaf URL
// prefixes so the right pill lights on any deep route. The active item is a
// solid GOLD pill (the admin's signature accent) with a near-black icon + label
// — the counterpart of the dashboard's solid-white active pill.
const NAV: {
  label: string;
  href: string;
  match: RegExp;
  icon: LucideIcon;
}[] = [
  { label: "System", href: "/", match: /^\/($|system)/, icon: Activity },
  { label: "Traffic", href: "/streams", match: /^\/(streams|usage)/, icon: Radio },
  { label: "Accounts", href: "/accounts", match: /^\/accounts/, icon: Building2 },
  {
    label: "Governance",
    href: "/audit-log",
    match: /^\/(audit-log|admins)/,
    icon: ShieldCheck,
  },
];

const ICON_SIZE = {
  width: "clamp(18px,1.6vw,22px)",
  height: "clamp(18px,1.6vw,22px)",
};

const ICON_SLOT = "3rem"; // fixed centered slot = collapsed rail content width

// The centered, fixed-width icon slot shared by every pill (and the avatar), so
// a collapsed icon is dead-centered and never slides when the rail expands — the
// label simply cross-fades in beside it.
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
// on home↔non-home navigation. The expand is JS-driven (not just CSS :hover)
// because after a client-side navigation the browser won't re-apply :hover to a
// freshly-mounted rail under a STATIONARY cursor — so clicking a nav item would
// otherwise auto-collapse the rail on the new page until you wiggle the mouse.
let railOpen = false;
let lastPointer: { x: number; y: number } | null = null;

export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  // Seed from the persisted module flag so a remounted rail paints already-open
  // (no collapse flash) when the cursor is still over it after navigating.
  const [open, setOpen] = useState(() => railOpen);

  // Single source of truth for the expand: the pointer is inside the rail's
  // CURRENT box (collapsed 3.75rem or expanded). Natural hysteresis — entering
  // the narrow rail opens it; you stay open until you leave the WIDE rail.
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

  const isHome = pathname === "/";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

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
  // rail's overflow-x-hidden and faded out; on hover they cross-fade in.
  function labelCls(color: string) {
    return clsx(
      LABEL_BASE,
      "opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-data-[open=true]:opacity-100",
      color,
    );
  }

  return (
    <aside
      ref={asideRef}
      data-open={open ? "true" : "false"}
      className={clsx(
        // Tight symmetric px-1.5 (6px) margin: the icon-slot is centered in the
        // 3.75rem dock. The rail owns ALL the left padding (its parent has none)
        // so its hover box reaches the screen's left edge.
        "dn-rail-dock dn-scroll group hidden md:flex md:flex-col gap-1.5 px-1.5 shrink-0 overflow-x-hidden overflow-y-auto pb-4 sm:pb-6 md:pb-8",
        // Home's rail fills the sticky viewport-tall wrapper; elsewhere it's a
        // flex item that already stretches to full height.
        isHome && "h-full",
      )}
    >
      {/* Admin identity at the top-left. Avatar centered in the same slot as the
          nav icons; avatar-only until hover, then the name reveals. Sized to the
          top tools-row height (--dn-topbar-h) so the first nav button lands at
          the content panel's top edge. */}
      <div
        className="flex items-center shrink-0"
        // Height = tools-row height MINUS the rail's gap-1.5 (0.375rem) so the
        // first nav button lands at y = --dn-topbar-h.
        style={{ height: "calc(var(--dn-topbar-h) - 0.375rem)" }}
      >
        <Slot>
          <span
            className="grid place-items-center rounded-full bg-[var(--dn-creek-mid)] text-[var(--dn-creek-dark)] font-bold shrink-0"
            style={{
              width: "clamp(30px,3vw,38px)",
              height: "clamp(30px,3vw,38px)",
              fontSize: "clamp(0.78rem,1.05vw,0.98rem)",
            }}
            aria-hidden
          >
            {initial}
          </span>
        </Slot>
        <div className="min-w-0 leading-tight pr-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-data-[open=true]:opacity-100">
          <p className="font-bold text-[clamp(0.66rem,0.82vw,0.78rem)] text-white/50 truncate">
            Welcome back,
          </p>
          <p className="font-bold text-[clamp(0.9rem,1.05vw,1.05rem)] text-white/85 truncate capitalize">
            {name}
          </p>
        </div>
      </div>

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
                    active ? "text-[#1c1610]" : "text-white/80",
                  )}
                  style={ICON_SIZE}
                />
              </Slot>
              <span
                className={labelCls(active ? "text-[#1c1610]" : "text-white/80")}
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
