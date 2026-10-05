// Centro de soporte: categorías y estados de los tickets.

export const SUPPORT_CATEGORIES = [
  { id: "cuenta", label: "Mi cuenta o acceso" },
  { id: "redes", label: "Conectar redes" },
  { id: "sitio", label: "Mi sitio o diseño" },
  { id: "pagos", label: "Pagos y plan" },
  { id: "idea", label: "Tengo una idea" },
  { id: "otro", label: "Otra cosa" },
] as const;

export const SUPPORT_STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: "Abierto", tone: "bg-coral/10 text-coral" },
  waiting: { label: "Esperando tu respuesta", tone: "bg-lime/40 text-ink" },
  closed: { label: "Cerrado", tone: "bg-ink/5 text-ink/60" },
};

/** Cómo ve el equipo cada estado ("waiting" = esperando a la cuenta). */
export const SUPPORT_STATUS_TEAM: Record<string, string> = {
  open: "Abierto",
  waiting: "Esperando a la cuenta",
  closed: "Cerrado",
};

export function supportCategoryLabel(id: string) {
  return SUPPORT_CATEGORIES.find((c) => c.id === id)?.label ?? "Otra cosa";
}

export const isSupportCategory = (value: string) => SUPPORT_CATEGORIES.some((c) => c.id === value);
