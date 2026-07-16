import { SectionTabs } from "@/components/data/section-tabs";

// Traffic section — the rail's second pill (→ /streams). Groups the two
// platform-traffic views (stream sessions + usage) behind one SectionTabs strip.
const TABS = [
  { label: "Streams", href: "/streams" },
  { label: "Usage", href: "/usage" },
];

export default function TrafficLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="space-y-4 md:space-y-6">
      <SectionTabs tabs={TABS} ariaLabel="Traffic sections" />
      {children}
    </section>
  );
}
