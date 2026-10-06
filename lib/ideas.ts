// Centro de mejora continua: categorías y estados de las ideas (sin dependencias de servidor).
import { pickLabel, type AdminLang } from "./admin-lang";

export const IDEA_CATEGORIES = [
  { id: "sitio", label: "Mi sitio y diseño", labelEn: "My site & design" },
  { id: "contenido", label: "Contenido y calendario", labelEn: "Content & calendar" },
  { id: "redes", label: "Redes y métricas", labelEn: "Social & metrics" },
  { id: "marcas", label: "Marcas y colaboraciones", labelEn: "Brands & collaborations" },
  { id: "ia", label: "Inteligencia artificial", labelEn: "Artificial intelligence" },
  { id: "otro", label: "Otra cosa", labelEn: "Something else" },
] as const;

export const IDEA_STATUS = [
  { id: "new", label: "Nueva", labelEn: "New", tone: "bg-coral/10 text-coral" },
  { id: "review", label: "En revisión", labelEn: "In review", tone: "bg-lime/40 text-ink" },
  { id: "planned", label: "Planeada", labelEn: "Planned", tone: "bg-cobalt/10 text-cobalt-ink" },
  { id: "done", label: "¡Ya está!", labelEn: "Shipped!", tone: "bg-sage/40 text-cobalt-ink" },
  { id: "declined", label: "No por ahora", labelEn: "Not for now", tone: "bg-ink/5 text-ink/60" },
] as const;

export type IdeaStatus = (typeof IDEA_STATUS)[number]["id"];

export const isIdeaCategory = (value: string) => IDEA_CATEGORIES.some((c) => c.id === value);
export const isIdeaStatus = (value: string): value is IdeaStatus => IDEA_STATUS.some((s) => s.id === value);
export const ideaCategoryLabel = (id: string, lang: AdminLang = "es") =>
  pickLabel(lang, IDEA_CATEGORIES.find((c) => c.id === id) ?? IDEA_CATEGORIES[IDEA_CATEGORIES.length - 1]);
export const ideaStatus = (id: string) => IDEA_STATUS.find((s) => s.id === id) ?? IDEA_STATUS[0];
