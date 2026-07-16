"use client";

import Link from "next/link";
import { PageHeader } from "@/components/data/page-header";
import { StatTile } from "@/components/data/stat-tile";
import { StatusBadge } from "@/components/data/status-badge";
import { RelativeTime } from "@/components/data/relative-time";
import { useUpstreamList } from "@/lib/api/use-list";
import type { AdminStreamsSummary, SystemHealth } from "@/types/admin";

function componentTone(status: string): "positive" | "warn" | "danger" {
  if (status === "ok") return "positive";
  if (status === "unreachable") return "warn";
  return "danger";
}

/** "3d 4h" / "2h 15m" / "45m" — coarse on purpose; it answers "did the
 * process restart recently", not "how many seconds exactly". */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// System · Overview — the scrolling Home tab. Component-health rollup + a
// "Streams now" summary + drill-in links. Detailed graphs live under the
// Activity tab, control-plane counters under the Control plane tab.
export function SystemOverviewClient() {
  const { data: health } = useUpstreamList<SystemHealth>(
    "/v1/admin/system/health",
    { refreshInterval: 15_000 },
  );
  const { data: streams } = useUpstreamList<AdminStreamsSummary>(
    "/v1/admin/streams/summary",
    { refreshInterval: 15_000 },
  );

  return (
    <div>
      <PageHeader
        eyebrow="platform"
        title="System"
        accent="health"
        description="Live rollup of the API, database, streaming server, and processors. Polls every 15 seconds."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="API"
          tone={health ? componentTone(health.api.status) : "neutral"}
          value={health ? health.api.status : "…"}
          hint={
            health
              ? [
                  `v${health.api.version} · ${health.api.environment}`,
                  health.api.runtime?.uptime_seconds != null
                    ? `up ${formatUptime(health.api.runtime.uptime_seconds)}`
                    : null,
                  health.api.runtime?.memory_rss_mb != null
                    ? `${Math.round(health.api.runtime.memory_rss_mb)} MB`
                    : null,
                  health.api.runtime?.load_1m != null
                    ? `load ${health.api.runtime.load_1m.toFixed(2)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : undefined
          }
        />
        <StatTile
          label="Database"
          tone={health ? componentTone(health.database.status) : "neutral"}
          value={health ? health.database.status : "…"}
          hint={
            health?.database.status === "ok"
              ? `${health.database.latency_ms ?? "?"} ms`
              : health?.database.error
          }
        />
        <StatTile
          label="Streaming server"
          tone={health ? componentTone(health.streaming_server.status) : "neutral"}
          value={health ? health.streaming_server.status : "…"}
          hint={
            health?.streaming_server.status === "ok"
              ? `${health.streaming_server.active_paths ?? 0} active paths`
              : health?.streaming_server.error
          }
        />
        <StatTile
          label="Processors"
          tone={
            !health
              ? "neutral"
              : health.processors.failed > 0
                ? "danger"
                : health.processors.stale > 0
                  ? "warn"
                  : "positive"
          }
          value={health ? `${health.processors.active} active` : "…"}
          hint={
            health ? (
              <>
                {health.processors.stale} stale · {health.processors.failed} failed
                {health.processors.latest_update_at ? (
                  <>
                    {" · last update "}
                    <RelativeTime value={health.processors.latest_update_at} />
                  </>
                ) : null}
              </>
            ) : undefined
          }
        />
      </div>

      <h2 className="font-bold text-[clamp(1.1rem,1.5vw,1.4rem)] mt-10 mb-4">
        Streams <span className="dn-grad-text">now</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Active sessions"
          tone={(streams?.by_state["streaming"] ?? 0) > 0 ? "positive" : "neutral"}
          value={
            streams
              ? (streams.by_state["streaming"] ?? 0) + (streams.by_state["approved"] ?? 0)
              : "…"
          }
          hint={
            streams ? (
              <span className="font-mono">
                {Object.entries(streams.by_state)
                  .map(([state, count]) => `${state}: ${count}`)
                  .join(" · ") || "none"}
              </span>
            ) : undefined
          }
        />
        <StatTile
          label="Started (24h)"
          value={streams ? streams.started_24h : "…"}
          hint={streams ? `across ${streams.accounts_streaming} streaming account(s)` : undefined}
        />
        <StatTile
          label="Validation failures (24h)"
          tone={(streams?.validation_failures_24h ?? 0) > 0 ? "warn" : "neutral"}
          value={streams ? streams.validation_failures_24h : "…"}
        />
        <StatTile
          label="Open reliability findings"
          tone={(streams?.open_reliability_findings ?? 0) > 0 ? "warn" : "neutral"}
          value={streams ? streams.open_reliability_findings : "…"}
        />
      </div>

      <div className="dn-tile px-5 py-4 mt-10 flex items-center gap-4 flex-wrap text-sm">
        <span className="text-[var(--dn-text-50)] font-mono text-xs uppercase tracking-wider">
          Drill in
        </span>
        <Link href="/streams" className="text-[var(--dn-creek-mid)] hover:underline">
          All stream sessions →
        </Link>
        <Link href="/accounts" className="text-[var(--dn-creek-mid)] hover:underline">
          Accounts →
        </Link>
        <Link href="/usage" className="text-[var(--dn-creek-mid)] hover:underline">
          Usage →
        </Link>
        {health ? (
          <span className="ml-auto flex items-center gap-2 text-[var(--dn-text-50)] text-xs">
            api <StatusBadge status={health.api.status} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
