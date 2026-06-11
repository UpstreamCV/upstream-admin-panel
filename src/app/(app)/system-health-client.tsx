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
  HealthHistory,
  SystemHealth,
  SystemTimeseries,
} from "@/types/admin";

function componentTone(status: string): "positive" | "warn" | "danger" {
  if (status === "ok") return "positive";
  if (status === "unreachable") return "warn";
  return "danger";
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

  const points = series?.points ?? [];
  const totalSessions = points.reduce((sum, p) => sum + p.sessions_started, 0);
  const totalFailures = points.reduce((sum, p) => sum + p.validation_failures, 0);
  const totalMinutes = points.reduce((sum, p) => sum + p.streaming_minutes, 0);
  const fpsValues = points.map((p) => p.avg_fps);
  const latestFps = [...fpsValues].reverse().find((v) => v !== null) ?? null;

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
          hint={health ? `v${health.api.version} · ${health.api.environment}` : undefined}
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
