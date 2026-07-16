"use client";

import { PageHeader } from "@/components/data/page-header";
import { StatTile } from "@/components/data/stat-tile";
import { useUpstreamList } from "@/lib/api/use-list";
import type { ControlPlaneMetrics } from "@/types/admin";

/** "3d 4h" / "2h 15m" / "45m" — coarse; answers "did the process restart
 * recently", not "how many seconds exactly". */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// System · Control plane — counters from the API's in-process Prometheus
// registry (the same data the monitoring box scrapes). Reset on API restart.
export function SystemControlPlaneClient() {
  const { data: metrics } = useUpstreamList<ControlPlaneMetrics>(
    "/v1/admin/system/metrics",
    { refreshInterval: 15_000 },
  );

  return (
    <div>
      <PageHeader
        eyebrow="platform"
        title="Control"
        accent="plane"
        description="Counters from the API's in-process Prometheus registry. Reset on API restart."
        actions={
          <span className="text-xs font-mono text-[var(--dn-text-50)]">
            {metrics
              ? `counters since API restart · up ${formatUptime(metrics.process_uptime_seconds)}`
              : "counters since API restart"}
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Ingest webhooks"
          tone={
            !metrics
              ? "neutral"
              : metrics.ingest_webhooks.server_error > 0
                ? "danger"
                : metrics.ingest_webhooks.client_error > 0
                  ? "warn"
                  : "positive"
          }
          value={
            metrics
              ? (
                  metrics.ingest_webhooks.ok +
                  metrics.ingest_webhooks.client_error +
                  metrics.ingest_webhooks.server_error
                ).toLocaleString()
              : "…"
          }
          hint={
            metrics ? (
              <span className="font-mono">
                {metrics.ingest_webhooks.ok.toLocaleString()} ok ·{" "}
                {metrics.ingest_webhooks.client_error} 4xx ·{" "}
                {metrics.ingest_webhooks.server_error} 5xx
              </span>
            ) : undefined
          }
        />
        <StatTile
          label="Stream auth"
          tone={
            !metrics ? "neutral" : metrics.stream_auth.denied > 0 ? "warn" : "positive"
          }
          value={metrics ? metrics.stream_auth.allowed.toLocaleString() : "…"}
          hint={
            metrics ? (
              <span className="font-mono">
                allowed · {metrics.stream_auth.denied} denied
              </span>
            ) : undefined
          }
        />
        <StatTile
          label="Time to streaming"
          tone={
            !metrics || metrics.time_to_streaming.p95_seconds === null
              ? "neutral"
              : // SLI from the observability design doc: p95 < 8 s.
                metrics.time_to_streaming.p95_seconds < 8
                ? "positive"
                : "warn"
          }
          value={
            metrics
              ? metrics.time_to_streaming.p95_seconds !== null
                ? `${metrics.time_to_streaming.p95_seconds.toFixed(1)}s`
                : "—"
              : "…"
          }
          hint={
            metrics ? (
              <span className="font-mono">
                p95 · p50 {metrics.time_to_streaming.p50_seconds?.toFixed(1) ?? "—"}s ·{" "}
                {metrics.time_to_streaming.count} session(s)
              </span>
            ) : undefined
          }
        />
        <StatTile
          label="Sessions failed"
          tone={
            !metrics ? "neutral" : metrics.sessions_failed_total > 0 ? "warn" : "positive"
          }
          value={metrics ? metrics.sessions_failed_total : "…"}
          hint={
            metrics ? (
              <span className="font-mono">
                of {metrics.session_transitions_total.toLocaleString()} transitions ·
                pool {metrics.db_pool.in_use}/{metrics.db_pool.size}
              </span>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
