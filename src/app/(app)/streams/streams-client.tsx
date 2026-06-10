"use client";

import clsx from "clsx";
import { Radio } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RelativeTime } from "@/components/data/relative-time";
import { StatusBadge } from "@/components/data/status-badge";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminStreamItem, AdminStreamList } from "@/types/admin";

const STATES = ["all", "streaming", "approved", "ended", "expired", "failed"] as const;
const PAGE_SIZE = 50;

const COLUMNS: Column<AdminStreamItem>[] = [
  {
    key: "state",
    header: "State",
    cell: (row) => <StatusBadge status={row.state} />,
  },
  {
    key: "account",
    header: "Account",
    cell: (row) => (
      <span>
        {row.account_name}{" "}
        <span className="text-ink-mute mono text-xs">/{row.account_slug}</span>
      </span>
    ),
  },
  {
    key: "camera",
    header: "Camera",
    cell: (row) => row.camera_name ?? <span className="text-ink-mute">—</span>,
  },
  {
    key: "heartbeat",
    header: "Last heartbeat",
    cell: (row) =>
      row.latest_heartbeat ? (
        <span className="mono text-xs">
          {row.latest_heartbeat.fps?.toFixed(1) ?? "?"} fps ·{" "}
          {row.latest_heartbeat.bitrate_kbps ?? "?"} kbps ·{" "}
          <RelativeTime value={row.latest_heartbeat.reported_at} />
        </span>
      ) : (
        <span className="text-ink-mute">—</span>
      ),
  },
  {
    key: "validation",
    header: "Validated",
    align: "center",
    cell: (row) =>
      row.latest_validation_passed === null ? (
        <span className="text-ink-mute">—</span>
      ) : row.latest_validation_passed ? (
        <span className="text-accent mono text-xs">pass</span>
      ) : (
        <span className="text-[#e89e93] mono text-xs">fail</span>
      ),
  },
  {
    key: "processor",
    header: "Processor",
    cell: (row) =>
      row.processor_status ? (
        <StatusBadge status={row.processor_status} />
      ) : (
        <span className="text-ink-mute">—</span>
      ),
  },
  {
    key: "created",
    header: "Created",
    cell: (row) => <RelativeTime value={row.created_at} />,
  },
];

export function StreamsClient() {
  const accountId = useSearchParams().get("account");
  const [state, setState] = useState<(typeof STATES)[number]>("all");
  const [page, setPage] = useState(0);

  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(page * PAGE_SIZE),
  });
  if (state !== "all") query.set("state", state);
  if (accountId) query.set("account_id", accountId);

  const { data, isLoading } = useUpstreamList<AdminStreamList>(
    `/v1/admin/streams?${query.toString()}`,
    { refreshInterval: 10_000 },
  );

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        eyebrow="cross-account"
        title="Stream"
        accent="sessions"
        description="Every session across every tenant, newest first. Polls every 10 seconds."
      />

      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setState(s);
              setPage(0);
            }}
            className={clsx(
              "rounded-full px-3 py-1 text-xs mono uppercase tracking-wide transition border",
              state === s
                ? "bg-glass-bg border-glass-stroke text-ink"
                : "border-transparent text-ink-soft hover:text-ink hover:bg-white/5",
            )}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-mute mono">
          {isLoading ? "loading…" : `${total} session(s)`}
        </span>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        rowHref={(row) => `/streams/${row.id}`}
        emptyState={
          <EmptyState
            icon={Radio}
            title="No sessions"
            description="No stream sessions match this filter yet."
          />
        }
      />

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
