// Centro de mejora continua: categorías y estados de las ideas (sin dependencias de servidor).

export const IDEA_CATEGORIES = [
  { id: "sitio", label: "Mi sitio y diseño" },
  { id: "contenido", label: "Contenido y calendario" },
  { id: "redes", label: "Redes y métricas" },
  { id: "marcas", label: "Marcas y colaboraciones" },
  { id: "ia", label: "Inteligencia artificial" },
  { id: "otro", label: "Otra cosa" },
] as const;

export const IDEA_STATUS = [
  { id: "new", label: "Nueva", tone: "bg-coral/10 text-coral" },
  { id: "review", label: "En revisión", tone: "bg-lime/40 text-ink" },
  { id: "planned", label: "Planeada", tone: "bg-cobalt/10 text-cobalt-ink" },
  { id: "done", label: "¡Ya está!", tone: "bg-sage/40 text-cobalt-ink" },
  { id: "declined", label: "No por ahora", tone: "bg-ink/5 text-ink/60" },
] as const;

export type IdeaStatus = (typeof IDEA_STATUS)[number]["id"];

export const isIdeaCategory = (value: string) => IDEA_CATEGORIES.some((c) => c.id === value);
export const isIdeaStatus = (value: string): value is IdeaStatus => IDEA_STATUS.some((s) => s.id === value);
export const ideaCategoryLabel = (id: string) => IDEA_CATEGORIES.find((c) => c.id === id)?.label ?? "Otra cosa";
export const ideaStatus = (id: string) => IDEA_STATUS.find((s) => s.id === id) ?? IDEA_STATUS[0];
