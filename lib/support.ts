// Centro de soporte: categorías y estados de los tickets (sin dependencias de servidor).
import { pickLabel, type AdminLang } from "./admin-lang";

export const SUPPORT_CATEGORIES = [
  { id: "cuenta", label: "Mi cuenta o acceso", labelEn: "My account or access" },
  { id: "redes", label: "Conectar redes", labelEn: "Connecting social accounts" },
  { id: "sitio", label: "Mi sitio o diseño", labelEn: "My site or design" },
  { id: "pagos", label: "Pagos y plan", labelEn: "Payments & plan" },
  { id: "idea", label: "Tengo una idea", labelEn: "I have an idea" },
  { id: "otro", label: "Otra cosa", labelEn: "Something else" },
] as const;

export const SUPPORT_STATUS: Record<string, { label: string; labelEn: string; tone: string }> = {
  open: { label: "Abierto", labelEn: "Open", tone: "bg-coral/10 text-coral" },
  waiting: { label: "Esperando tu respuesta", labelEn: "Waiting for your reply", tone: "bg-lime/40 text-ink" },
  closed: { label: "Cerrado", labelEn: "Closed", tone: "bg-ink/5 text-ink/60" },
};

/** Cómo ve el equipo cada estado ("waiting" = esperando a la cuenta). */
export const SUPPORT_STATUS_TEAM: Record<string, { label: string; labelEn: string }> = {
  open: { label: "Abierto", labelEn: "Open" },
  waiting: { label: "Esperando a la cuenta", labelEn: "Waiting for the account" },
  closed: { label: "Cerrado", labelEn: "Closed" },
};

export function supportCategoryLabel(id: string, lang: AdminLang = "es") {
  const category = SUPPORT_CATEGORIES.find((c) => c.id === id) ?? SUPPORT_CATEGORIES[SUPPORT_CATEGORIES.length - 1];
  return pickLabel(lang, category);
}

export const isSupportCategory = (value: string) => SUPPORT_CATEGORIES.some((c) => c.id === value);
