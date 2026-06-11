export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 md:mb-6 flex items-end justify-between gap-6 flex-wrap">
      <div className="min-w-0">
        <p className="text-[clamp(0.62rem,0.8vw,0.78rem)] font-bold uppercase tracking-wide text-[var(--dn-text-50)]">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-bold leading-tight text-[clamp(1.5rem,2.4vw,2.2rem)]">
          {title} <span className="dn-grad-text">{accent}</span>
        </h1>
        {description ? (
          <p className="mt-2 max-w-prose text-[clamp(0.85rem,1vw,1rem)] text-[var(--dn-text-50)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
