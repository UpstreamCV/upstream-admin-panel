import { StatusDot, type DotStatus } from "./status-dot";

// Status pill = halo dot + label, the dashboard-next table grammar. Same
// component API as before (pages pass raw status strings).
const STATUS_DOT: Record<string, DotStatus> = {
  // healthy / active
  active: "green",
  online: "green",
  streaming: "green",
  approved: "green",
  ok: "green",
  processing: "green",
  attached: "green",
  // neutral / finished
  idle: "neutral",
  offline: "neutral",
  disabled: "neutral",
  ended: "neutral",
  expired: "neutral",
  stopped: "neutral",
  info: "neutral",
  // transitional / warning
  validating: "yellow",
  reconnecting: "yellow",
  connecting: "yellow",
  pending: "yellow",
  starting: "yellow",
  lagging: "yellow",
  suspended: "yellow",
  unreachable: "yellow",
  warning: "yellow",
  // bad
  error: "red",
  failed: "red",
  rejected: "red",
  revoked: "red",
  critical: "red",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      className={`inline-flex items-center gap-1.5 text-[clamp(0.72rem,0.9vw,0.85rem)] font-bold ${className ?? ""}`}
    >
      <StatusDot status={STATUS_DOT[status] ?? "neutral"} />
      {status}
    </span>
  );
}
