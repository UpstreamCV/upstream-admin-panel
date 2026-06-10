import clsx from "clsx";

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
    <div className="glass rounded-2xl px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mono">{label}</p>
      <p
        className={clsx(
          "display text-2xl font-semibold mt-1.5",
          tone === "positive" && "text-accent",
          tone === "warn" && "text-[#d4c98a]",
          tone === "danger" && "text-[#e89e93]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-xs text-ink-soft mt-1">{hint}</p> : null}
    </div>
  );
}
