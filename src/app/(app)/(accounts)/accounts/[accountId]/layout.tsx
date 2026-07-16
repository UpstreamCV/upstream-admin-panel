import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionTabs } from "@/components/data/section-tabs";
import { AccountDetailHeader } from "./account-detail-header";

// Account detail layout — persistent back-link + header + tab strip. Wraps the
// five tab segments (plan / usage / members / limits / tokens). Mirrors the
// dashboard's camera-detail layout.
export default async function AccountDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const base = `/accounts/${accountId}`;
  const tabs = [
    { label: "Plan", href: base },
    { label: "Usage", href: `${base}/usage` },
    { label: "Members", href: `${base}/members` },
    { label: "Limits", href: `${base}/limits` },
    { label: "Tokens", href: `${base}/tokens` },
  ];

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1 text-[clamp(0.78rem,1vw,0.92rem)] text-[var(--dn-text-70)] hover:text-[var(--dn-text)] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Accounts
        </Link>
      </div>

      <AccountDetailHeader accountId={accountId} />

      <SectionTabs tabs={tabs} ariaLabel="Account sections" />

      {children}
    </section>
  );
}
