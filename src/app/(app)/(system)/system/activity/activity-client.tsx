"use client";

import clsx from "clsx";
import { useState } from "react";
import { PageHeader } from "@/components/data/page-header";
import { AreaSpark, BarSpark, GraphTile, UptimeStrip } from "@/components/data/spark";
import { useUpstreamList } from "@/lib/api/use-list";
import type { HealthHistory, SystemTimeseries } from "@/types/admin";

const RANGES = [
  { hours: 24, label: "24h" },
  { hours: 72, label: "3d" },
  { hours: 168, label: "7d" },
] as const;

// System · Activity — hourly control-plane timeseries (sessions/failures/
// minutes/fps/alerts/workflows/objects/confidence) plus a server-sampled
// last-hour strip (DB latency, component uptime, active sessions).
export function SystemActivityClient() {
  const [hours, setHours] = useState<number>(24);
  const { data: series } = useUpstreamList<SystemTimeseries>(
    `/v1/admin/system/timeseries?hours=${hours}`,
    { refreshInterval: 60_000 },
  );
  // Server-collected samples (the API's in-process sampler loop) — shared
  // across tabs and collected even when nobody is watching.
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
  // `?? 0` / `?? null`: an older API build omits these fields entirely, and
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
        title="Activity"
        accent="history"
        description="Hourly control-plane timeseries and the last hour of server-sampled health."
        actions={
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
        }
      />

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
    </div>
  );
}
