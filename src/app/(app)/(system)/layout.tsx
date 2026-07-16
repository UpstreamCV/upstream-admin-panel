import { SectionTabs } from "@/components/data/section-tabs";

// System section — the rail's first pill (→ /). Renders the shared SectionTabs
// strip above every System sub-view; the group's loading.tsx sits BELOW this
// layout so the strip persists across tab navigation. Overview (/) is also the
// scrolling Home (see AppShell), so this strip renders at the top of the home
// panel's scrolling content.
const TABS = [
  { label: "Overview", href: "/" },
  { label: "Activity", href: "/system/activity" },
  { label: "Control plane", href: "/system/control-plane" },
];

export default function SystemLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="space-y-4 md:space-y-6">
      <SectionTabs tabs={TABS} ariaLabel="System sections" />
      {children}
    </section>
  );
}
