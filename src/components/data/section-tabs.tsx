"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Secondary sub-nav strip for a sidebar SECTION (System / Traffic / Governance)
// and for detail pages (stream / account). Ported from upstream-dashboard's
// section-tabs.tsx. Takes absolute hrefs, so it can sit at the top of a
// route-group layout (or a detail layout, with hrefs built from an id) and
// switch between the section's sub-areas.
//
// Prefix-match note: a tab stays active on its sub-routes (e.g. /audit-log
// active on /audit-log/…). Safe as long as no tab href is a prefix of a sibling
// tab href — true for every section today; revisit if that ever overlaps.
export function SectionTabs({
  tabs,
  ariaLabel,
}: {
  tabs: { label: string; href: string }[];
  ariaLabel: string;
}) {
  const pathname = usePathname();

  // Chrome-style tab strip: tabs are centered and sit ON a bottom rule; the
  // active tab is a raised, rounded-top "foreground" tab that breaks through the
  // rule (-mb-px) so it reads as connected to the content below — browser tabs.
  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap items-end justify-center gap-1 border-b border-white/15"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-t-lg px-4 py-2 text-[clamp(0.78rem,1vw,0.92rem)] transition",
              active
                ? "dn-tab dn-tab-active -mb-px font-bold text-white"
                : "text-white/55 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
