"use client";

import clsx from "clsx";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RelativeTime } from "@/components/data/relative-time";
import { StatusBadge } from "@/components/data/status-badge";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminAccountItem, AdminAccountList } from "@/types/admin";

const STATUSES = ["all", "active", "suspended"] as const;
const PAGE_SIZE = 50;

const COLUMNS: Column<AdminAccountItem>[] = [
  {
    key: "name",
    header: "Account",
    cell: (row) => (
      <span>
        {row.name} <span className="text-ink-mute mono text-xs">/{row.slug}</span>
      </span>
    ),
  },
  {
    key: "plan",
    header: "Plan",
    cell: (row) => <span className="mono text-xs uppercase">{row.plan}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  { key: "members", header: "Members", align: "right", cell: (row) => row.member_count },
  { key: "agents", header: "Agents", align: "right", cell: (row) => row.agent_count },
  { key: "cameras", header: "Cameras", align: "right", cell: (row) => row.camera_count },
  {
    key: "active",
    header: "Active streams",
    align: "right",
    cell: (row) =>
      row.active_sessions > 0 ? (
        <span className="text-accent mono">{row.active_sessions}</span>
      ) : (
        <span className="text-ink-mute">0</span>
      ),
  },
  {
    key: "created",
    header: "Created",
    cell: (row) => <RelativeTime value={row.created_at} />,
  },
];

export function AccountsClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [page, setPage] = useState(0);

  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(page * PAGE_SIZE),
  });
  if (search.trim()) query.set("search", search.trim());
  if (status !== "all") query.set("status", status);

  const { data, isLoading } = useUpstreamList<AdminAccountList>(
    `/v1/admin/accounts?${query.toString()}`,
    { refreshInterval: 30_000 },
  );

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        eyebrow="tenants"
        title="All"
        accent="accounts"
        description="Every tenant on the platform with member, device, and live-stream counts."
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search name or slug…"
          className="rounded-xl bg-glass-bg border border-glass-stroke px-3.5 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-accent/60 transition w-64"
        />
        <div className="flex items-center gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setPage(0);
              }}
              className={clsx(
                "rounded-full px-3 py-1 text-xs mono uppercase tracking-wide transition border",
                status === s
                  ? "bg-glass-bg border-glass-stroke text-ink"
                  : "border-transparent text-ink-soft hover:text-ink hover:bg-white/5",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-ink-mute mono">
          {isLoading ? "loading…" : `${total} account(s)`}
        </span>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        rowHref={(row) => `/accounts/${row.id}`}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No accounts"
            description="No accounts match this filter."
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
