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
          <p className="font-mono text-xs uppercase tracking-widest text-moss">{eyebrow}</p>
        )}
        <h1 className="mt-sp-1 font-bodoni italic font-bold uppercase text-2xl text-ink sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-sp-2 max-w-xl text-sm text-ink/60">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
