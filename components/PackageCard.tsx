import type { ReactNode } from "react";

export interface PackageCardProps {
  emoji: string;
  name: string;
  items: string[];
  /** «Desde US$500», ya formateado en el idioma del sitio (null = sin precio). */
  price?: string | null;
  /** Botón «Solicitar» (C2); solo si la creadora activó las solicitudes de este paquete. */
  action?: ReactNode;
}

export default function PackageCard({ emoji, name, items, price, action }: PackageCardProps) {
  return (
    <div className="flex flex-col r-sm border border-line bg-surface p-sp-5">
      <span className="self-start rounded-full bg-lime/30 px-sp-4 py-sp-2 site-title text-ink">
        {emoji} {name}
      </span>
      {price && <p className="mt-sp-4 font-mono text-sm font-semibold uppercase tracking-wide text-coral">{price}</p>}
      <ul className="mt-sp-5 flex flex-col gap-sp-2 text-sm text-ink/70">
        {items.map((item, index) => (
          <li key={index} className="flex gap-sp-2">
            <span className="text-coral">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {action && <div className="mt-auto pt-sp-5">{action}</div>}
    </div>
  );
}
