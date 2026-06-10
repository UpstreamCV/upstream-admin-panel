"use client";

import { ScrollText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RelativeTime } from "@/components/data/relative-time";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminAuditLog } from "@/types/admin";

const PAGE_SIZE = 50;

function diffSummary(payload: AdminAuditLog["items"][number]["payload"]): string {
  const before = payload.before ?? {};
  const after = payload.after ?? {};
  const changed: string[] = [];
  for (const key of Object.keys(after)) {
    const prev = before[key];
    const next = after[key];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      changed.push(`${key}: ${JSON.stringify(prev)} → ${JSON.stringify(next)}`);
    }
  }
  return changed.join(", ");
}

export function AuditLogClient() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useUpstreamList<AdminAuditLog>(
    `/v1/admin/audit-log?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
    { refreshInterval: 30_000 },
  );

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        eyebrow="who did what"
        title="Audit"
        accent="log"
        description="Every mutating admin action: who, what, and the before/after diff."
      />

      {isLoading && !data ? (
        <p className="text-ink-mute text-sm">Loading…</p>
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No admin actions yet"
          description="Plan, status, and limits changes will appear here."
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <ul>
            {data?.items.map((entry) => (
              <li
                key={entry.id}
                className="px-5 py-3.5 border-b border-glass-stroke-2/60 last:border-0"
              >
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="mono text-xs text-accent">{entry.action}</span>
                  {entry.target_id ? (
                    entry.target_type.startsWith("account") ? (
                      <Link
                        href={`/accounts/${entry.target_id}`}
                        className="mono text-xs text-ink-soft hover:text-accent transition"
                      >
                        {entry.target_type} {entry.target_id.slice(0, 8)}…
                      </Link>
                    ) : (
                      <span className="mono text-xs text-ink-soft">
                        {entry.target_type} {entry.target_id.slice(0, 8)}…
                      </span>
                    )
                  ) : null}
                  <span className="ml-auto text-xs text-ink-mute">
                    by <span className="mono">{entry.admin_user_id.slice(0, 8)}…</span> ·{" "}
                    <RelativeTime value={entry.created_at} />
                  </span>
                </div>
                {diffSummary(entry.payload) ? (
                  <p className="text-xs text-ink-soft mono mt-1.5">
                    {diffSummary(entry.payload)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-end gap-2 mt-4 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-glass-stroke px-3 py-1 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-ink-mute mono text-xs">
            {page + 1} / {pages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-glass-stroke px-3 py-1 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}
