"use client";

import Link from "next/link";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminAccountDetail } from "@/types/admin";

// Account detail · Usage — the last 30 days of metered usage for this account.
export function AccountUsageClient({ accountId }: { accountId: string }) {
  const { data, error } = useUpstreamList<AdminAccountDetail>(
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

  const { usage_30d } = data;
  return (
    <div className="dn-tile px-5 py-4 max-w-xl">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--dn-text-50)] font-mono">
        Usage (30 days)
      </p>
      {usage_30d.length === 0 ? (
        <p className="text-sm text-[var(--dn-text-50)] mt-2">No usage recorded.</p>
      ) : (
        <dl className="mt-2 space-y-1.5">
          {usage_30d.map((u) => (
            <div key={`${u.event_type}-${u.unit}`} className="flex justify-between text-sm">
              <dt className="text-[var(--dn-text-70)] font-mono text-xs">{u.event_type}</dt>
              <dd className="font-mono">
                {u.total_quantity.toLocaleString()} {u.unit}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
