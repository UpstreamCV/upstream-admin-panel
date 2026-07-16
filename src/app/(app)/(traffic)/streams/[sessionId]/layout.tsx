import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionTabs } from "@/components/data/section-tabs";
import { StreamDetailHeader } from "./stream-detail-header";

// Stream-session detail layout — persistent back-link + header + tab strip.
// Wraps the three tab segments (overview / validations / reliability); lifting
// the header + tabs here keeps them visible across tab navigation. Mirrors the
// dashboard's camera-detail layout (a second-level nav stacked under the Traffic
// section's SectionTabs).
export default async function StreamDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const base = `/streams/${sessionId}`;
  const tabs = [
    { label: "Overview", href: base },
    { label: "Validations", href: `${base}/validations` },
    { label: "Reliability", href: `${base}/reliability` },
  ];

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/streams"
          className="inline-flex items-center gap-1 text-[clamp(0.78rem,1vw,0.92rem)] text-[var(--dn-text-70)] hover:text-[var(--dn-text)] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Streams
        </Link>
      </div>

      <StreamDetailHeader sessionId={sessionId} />

      <SectionTabs tabs={tabs} ariaLabel="Session sections" />

      {children}
    </section>
  );
}
