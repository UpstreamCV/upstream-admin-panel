import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="dn-tile px-8 py-14 text-center">
      <Icon className="w-7 h-7 mx-auto text-[var(--dn-creek-mid)]" />
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      {description ? (
        <p className="mt-3 mx-auto max-w-prose text-sm text-[var(--dn-text-50)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
