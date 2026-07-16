"use client";

import Link from "next/link";
import { IdentityCard, PlanAndStatusCard } from "./manage-cards";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminAccountDetail } from "@/types/admin";

// Account detail · Plan — plan/status controls + identity (name / slug) editor.
export function AccountPlanClient({ accountId }: { accountId: string }) {
  const { data, error, mutate } = useUpstreamList<AdminAccountDetail>(
    `/v1/admin/accounts/${accountId}`,
    { refreshInterval: 30_000 },
  );

  if (error) {
    return (
      <div className="dn-tile p-8 text-center">
        <p className="text-[var(--dn-text-70)]">Account not found.</p>
        <Link href="/accounts" className="text-[var(--dn-creek-mid)] hover:underline text-sm">
          ← Back to accounts
        </Link>
      </div>
    );
  }
  if (!data) {
    return <p className="text-[var(--dn-text-50)] text-sm">Loading…</p>;
  }

  const refresh = () => void mutate();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <PlanAndStatusCard account={data.account} onChanged={refresh} />
      <IdentityCard account={data.account} onChanged={refresh} />
    </div>
  );
}
