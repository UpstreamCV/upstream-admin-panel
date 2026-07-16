import { SectionTabs } from "@/components/data/section-tabs";

// Governance section — the rail's fourth pill (→ /audit-log). Groups the
// oversight views (audit log + platform admins) behind one SectionTabs strip.
const TABS = [
  { label: "Audit log", href: "/audit-log" },
  { label: "Admins", href: "/admins" },
];

export default function GovernanceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="space-y-4 md:space-y-6">
      <SectionTabs tabs={TABS} ariaLabel="Governance sections" />
      {children}
    </section>
  );
}
