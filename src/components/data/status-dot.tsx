export type DotStatus = "green" | "yellow" | "red" | "neutral";

// Halo status dot — same recipe as the dashboard's status-dot.tsx. Hex kept
// (not vars) so the `${color}22` halo trick stays valid.
const COLOR: Record<DotStatus, string> = {
  green: "#5fb869",
  yellow: "#eedc68",
  red: "#e15a4c",
  neutral: "#9aa39a",
};

export function StatusDot({ status }: { status: DotStatus }) {
  const color = COLOR[status];
  return (
    <span
      aria-hidden
      className="inline-block rounded-full shrink-0"
      style={{
        width: "clamp(10px, 1vw, 15px)",
        height: "clamp(10px, 1vw, 15px)",
        background: color,
        boxShadow: `0 0 0 4px ${color}22`,
      }}
    />
  );
}
