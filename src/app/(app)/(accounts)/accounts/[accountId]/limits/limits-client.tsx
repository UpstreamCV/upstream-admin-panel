"use client";

import Link from "next/link";
import { LimitsCard } from "../manage-cards";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminAccountDetail } from "@/types/admin";

// Account detail · Limits — the account_limits editor (future sessions only).
export function AccountLimitsClient({ accountId }: { accountId: string }) {
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

  return (
    <div className="max-w-2xl">
      <LimitsCard accountId={accountId} limits={data.limits} onChanged={() => void mutate()} />
    </div>
  );
}
