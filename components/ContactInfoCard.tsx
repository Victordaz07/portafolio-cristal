import type { ReactNode } from "react";
import { HeartIcon } from "@/components/icons";

export interface ContactInfoRow {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}

export default function ContactInfoCard({
  title,
  rows,
}: {
  title: string;
  rows: ContactInfoRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="relative rounded-md border border-lime/50 bg-white pt-sp-5 pb-sp-4">
      <span className="absolute -top-sp-3 left-sp-5 inline-flex items-center gap-sp-2 rounded-full bg-cobalt px-sp-4 py-sp-1 font-mono text-[11px] uppercase tracking-widest text-cream">
        <HeartIcon className="h-3 w-3" />
        {title}
      </span>

      <ul className="flex flex-col gap-sp-3 px-sp-5 pt-sp-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-sp-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime/25 text-coral">
              {row.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-ink/50">{row.label}</p>
              {row.href ? (
                <a
                  href={row.href}
                  target={row.href.startsWith("http") ? "_blank" : undefined}
                  rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="truncate text-sm font-medium text-ink hover:text-coral transition"
                >
                  {row.value}
                </a>
              ) : (
                <p className="truncate text-sm font-medium text-ink">{row.value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
