import Link from "next/link";
import type { ReactNode } from "react";
import { FileIcon } from "@/components/icons";

/**
 * Estado vacío con guía ("qué hago primero") en vez de una lista en blanco. Pensado para listas
 * del panel (Facturas, Acuerdos…) que al crear la cuenta se ven frías con un solo renglón de texto.
 */
export default function EmptyState({
  title,
  description,
  action,
  secondary,
  icon,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  secondary?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-sp-3 px-sp-5 py-sp-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-ink/35">
        {icon ?? <FileIcon className="h-6 w-6" />}
      </span>
      <div>
        <p className="font-fraunces text-lg font-medium text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">{description}</p>
      </div>
      {action && (
        <Link href={action.href} className="mt-sp-1 rounded-full bg-ink px-sp-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-coral">
          {action.label}
        </Link>
      )}
      {secondary && <div className="text-xs text-ink/55">{secondary}</div>}
    </div>
  );
}
