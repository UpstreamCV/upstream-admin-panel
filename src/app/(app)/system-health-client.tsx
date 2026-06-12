"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/data/page-header";
import { AreaSpark, BarSpark, GraphTile, UptimeStrip } from "@/components/data/spark";
import { StatTile } from "@/components/data/stat-tile";
import { StatusBadge } from "@/components/data/status-badge";
import { RelativeTime } from "@/components/data/relative-time";
import { useUpstreamList } from "@/lib/api/use-list";
import type {
  AdminStreamsSummary,
  ControlPlaneMetrics,
  HealthHistory,
  SystemHealth,
  SystemTimeseries,
} from "@/types/admin";

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

const RANGES = [
  { hours: 24, label: "24h" },
  { hours: 72, label: "3d" },
  { hours: 168, label: "7d" },
] as const;

export function SystemHealthClient() {
  const { data: health } = useUpstreamList<SystemHealth>("/v1/admin/system/health", {
    refreshInterval: 15_000,
  });
  const { data: streams } = useUpstreamList<AdminStreamsSummary>(
    "/v1/admin/streams/summary",
    { refreshInterval: 15_000 },
  );
  const [hours, setHours] = useState<number>(24);
  const { data: series } = useUpstreamList<SystemTimeseries>(
    `/v1/admin/system/timeseries?hours=${hours}`,
    { refreshInterval: 60_000 },
  );
  // Server-collected samples (the API's in-process sampler loop) — shared
  // across tabs and collected even when nobody is watching. The browser
  // only refreshes the view; it doesn't drive the probes.
  const { data: history } = useUpstreamList<HealthHistory>(
    "/v1/admin/system/health/history?minutes=60",
    { refreshInterval: 60_000 },
  );
  // Control-plane counters from the API's in-process Prometheus registry
  // (the same data the monitoring box scrapes). Reset on API restart.
  const { data: metrics } = useUpstreamList<ControlPlaneMetrics>(
    "/v1/admin/system/metrics",
    { refreshInterval: 15_000 },
  );

  const points = series?.points ?? [];
  const totalSessions = points.reduce((sum, p) => sum + p.sessions_started, 0);
  const totalFailures = points.reduce((sum, p) => sum + p.validation_failures, 0);
  const totalMinutes = points.reduce((sum, p) => sum + p.streaming_minutes, 0);
  const fpsValues = points.map((p) => p.avg_fps);
  const latestFps = [...fpsValues].reverse().find((v) => v !== null) ?? null;
  // `?? 0` / `?? null`: an older API build omits these fields entirely (the
  // panel auto-deploys from Netlify; the API deploys manually on EC2), and
  // summing undefined renders NaN tiles.
  const totalAlerts = points.reduce((sum, p) => sum + (p.alerts_fired ?? 0), 0);
  const totalWorkflowRuns = points.reduce((sum, p) => sum + (p.workflow_runs ?? 0), 0);
  const totalObjects = points.reduce((sum, p) => sum + (p.objects_detected ?? 0), 0);
  const confidenceValues = points.map((p) => p.avg_detection_confidence ?? null);
  const latestConfidence =
    [...confidenceValues].reverse().find((v) => v !== null) ?? null;

  const samples = history?.samples ?? [];
  const latencyValues = samples.map((s) => (s.db_ok ? s.db_latency_ms : null));
  const lastLatency = [...latencyValues].reverse().find((v) => v !== null) ?? null;
  const uptimeStatuses = samples.map((s) =>
    !s.db_ok || s.mediamtx_status === "error"
      ? ("down" as const)
      : s.mediamtx_status === "unreachable"
        ? ("warn" as const)
        : ("ok" as const),
  );
  const sessionValues = samples.map((s) => s.active_sessions);
  const lastSessions = sessionValues.length
    ? sessionValues[sessionValues.length - 1]
    : null;

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
          value={
            health
              ? `${health.processors.active} active`
              : "…"
          }
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

      <div className="flex items-center justify-between mt-10 mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-[clamp(1.1rem,1.5vw,1.4rem)]">
          Activity <span className="dn-grad-text">history</span>
        </h2>
        <div className="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.hours}
              type="button"
              onClick={() => setHours(r.hours)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wide transition border",
                hours === r.hours
                  ? "bg-[var(--dn-creek-mid)] border-transparent text-[#1c1610]"
                  : "border-transparent text-[var(--dn-text-70)] hover:text-[var(--dn-text)] hover:bg-white/5",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GraphTile
          label="Sessions started"
          headline={series ? totalSessions : "…"}
          hint={`per hour · last ${hours}h`}
        >
          <BarSpark values={points.map((p) => p.sessions_started)} />
        </GraphTile>
        <GraphTile
          label="Validation failures"
          headline={
            series ? (
              <span className={totalFailures > 0 ? "text-[#e89e93]" : undefined}>
                {totalFailures}
              </span>
            ) : (
              "…"
            )
          }
          hint={`per hour · last ${hours}h`}
        >
          <BarSpark values={points.map((p) => p.validation_failures)} color="#e15a4c" />
        </GraphTile>
        <GraphTile
          label="Streaming minutes"
          headline={series ? Math.round(totalMinutes).toLocaleString() : "…"}
          hint={`per hour · last ${hours}h`}
        >
          <AreaSpark values={points.map((p) => p.streaming_minutes)} />
        </GraphTile>
        <GraphTile
          label="Avg FPS"
          headline={latestFps !== null ? latestFps.toFixed(1) : "—"}
          hint={`hourly avg · gaps = no streams`}
        >
          <AreaSpark values={fpsValues} />
        </GraphTile>
        <GraphTile
          label="Alerts fired"
          headline={
            series ? (
              <span className={totalAlerts > 0 ? "text-[#eedc68]" : undefined}>
                {totalAlerts}
              </span>
            ) : (
              "…"
            )
          }
          hint={`per hour · last ${hours}h`}
        >
          <BarSpark values={points.map((p) => p.alerts_fired ?? 0)} color="#eedc68" />
        </GraphTile>
        <GraphTile
          label="Workflow runs"
          headline={series ? totalWorkflowRuns.toLocaleString() : "…"}
          hint={`per hour · last ${hours}h`}
        >
          <BarSpark values={points.map((p) => p.workflow_runs ?? 0)} />
        </GraphTile>
        <GraphTile
          label="Objects detected"
          headline={series ? totalObjects.toLocaleString() : "…"}
          hint={`per hour · last ${hours}h`}
        >
          <AreaSpark values={points.map((p) => p.objects_detected ?? 0)} />
        </GraphTile>
        <GraphTile
          label="Detection confidence"
          headline={latestConfidence !== null ? latestConfidence.toFixed(2) : "—"}
          hint={`hourly avg · gaps = no detections`}
        >
          <AreaSpark values={confidenceValues} />
        </GraphTile>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <GraphTile
          label="DB latency"
          headline={lastLatency !== null ? `${Math.round(lastLatency)} ms` : "…"}
          hint="last hour · sampled server-side"
        >
          <AreaSpark values={latencyValues} height={36} />
        </GraphTile>
        <GraphTile
          label="Component uptime"
          headline={
            uptimeStatuses.length
              ? `${Math.round((uptimeStatuses.filter((s) => s === "ok").length / uptimeStatuses.length) * 100)}%`
              : "…"
          }
          hint="DB + streaming server · last hour"
        >
          <UptimeStrip statuses={uptimeStatuses} height={36} />
        </GraphTile>
        <GraphTile
          label="Active sessions"
          headline={lastSessions ?? "…"}
          hint="last hour · sampled server-side"
        >
          <AreaSpark values={sessionValues} height={36} />
        </GraphTile>
      </div>

      <div className="flex items-center justify-between mt-10 mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-[clamp(1.1rem,1.5vw,1.4rem)]">
          Control <span className="dn-grad-text">plane</span>
        </h2>
        <span className="text-xs font-mono text-[var(--dn-text-50)]">
          {metrics
            ? `counters since API restart · up ${formatUptime(metrics.process_uptime_seconds)}`
            : "counters since API restart"}
        </span>
      </div>
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
