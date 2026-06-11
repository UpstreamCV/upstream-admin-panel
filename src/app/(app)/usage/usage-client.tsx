"use client";

import clsx from "clsx";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminUsageSummary } from "@/types/admin";

const RANGES = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
] as const;

export function UsageClient() {
  const [days, setDays] = useState<number>(30);

  const { data, isLoading } = useUpstreamList<AdminUsageSummary>(
    `/v1/admin/usage/summary?days=${days}`,
    { refreshInterval: 60_000 },
  );

  const rows = data?.rows ?? [];

  // Group rows by (event_type, unit) so each metric gets its own table with
  // proportional bars; per-account compare is the panel's main question.
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.event_type} (${row.unit})`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return (
    <div>
      <PageHeader
        eyebrow="billing ledger"
        title="Usage"
        accent="by account"
        description="Aggregated usage_events totals per account over the trailing window. This is the read side of the billing ledger — no payment processing exists yet."
        actions={
          <div className="flex items-center gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wide transition border",
                  days === r.days
                    ? "bg-[var(--dn-creek-mid)] border-transparent text-[#1c1610]"
                    : "border-transparent text-[var(--dn-text-70)] hover:text-[var(--dn-text)] hover:bg-white/5",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading && rows.length === 0 ? (
        <p className="text-[var(--dn-text-50)] text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No usage recorded"
          description={`No usage_events in the last ${days} days.`}
        />
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([metric, groupRows]) => {
            const max = Math.max(...groupRows.map((r) => r.total_quantity), 1);
            return (
              <section key={metric}>
                <h2 className="font-bold text-[clamp(1rem,1.3vw,1.25rem)] mb-3">
                  {metric.split(" (")[0]}{" "}
                  <span className="dn-grad-text">({metric.split(" (")[1]?.replace(")", "")})</span>
                </h2>
                <div className="dn-tile p-4 space-y-2.5">
                  {groupRows.map((row) => (
                    <div key={row.account_id} className="text-sm">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/accounts/${row.account_id}`}
                          className="hover:text-[var(--dn-creek-mid)] transition min-w-0 truncate"
                        >
                          {row.account_name}{" "}
                          <span className="text-[var(--dn-text-50)] font-mono text-xs">
                            /{row.account_slug} · {row.plan}
                          </span>
                        </Link>
                        <span className="ml-auto font-mono text-xs">
                          {row.total_quantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--dn-creek-mid)]"
                          style={{ width: `${(row.total_quantity / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
