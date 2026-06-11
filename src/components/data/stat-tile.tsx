// Compact stat tile — the dashboard's StatCard recipe with an extra hint line
// and the original tone API (mapped onto status-dot colors + value tint).
import { StatusDot, type DotStatus } from "./status-dot";

const TONE_DOT: Record<string, DotStatus> = {
  positive: "green",
  warn: "yellow",
  danger: "red",
  neutral: "neutral",
};

const TONE_VALUE: Record<string, string> = {
  positive: "",
  warn: "text-[#eedc68]",
  danger: "text-[#e15a4c]",
  neutral: "",
};

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "neutral" | "positive" | "warn" | "danger";
}) {
  return (
    <div className="dn-tile flex flex-col gap-2 p-[clamp(0.9rem,1.6vw,1.4rem)] min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)]">
          {label}
        </span>
        {tone !== "neutral" && <StatusDot status={TONE_DOT[tone]} />}
      </div>
      <span
        className={`font-bold leading-none text-[clamp(1.6rem,3.4vw,2.6rem)] ${TONE_VALUE[tone]}`}
      >
        {value}
      </span>
      {hint ? (
        <span className="text-[clamp(0.75rem,0.9vw,0.9rem)] text-[var(--dn-text-50)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
