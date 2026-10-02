import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-sp-7 flex flex-col gap-sp-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{eyebrow}</p>
        )}
        <h1 className="mt-sp-2 font-fraunces text-3xl font-medium italic leading-tight text-ink sm:text-[36px]">
          {title}
        </h1>
        {description && <p className="mt-sp-2 max-w-xl text-sm text-ink/60">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
