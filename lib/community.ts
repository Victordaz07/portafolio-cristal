// Comunidad Foliocrew: constantes y reglas puras (sin servidor; se usan también en el navegador).
// Todo tiene etiqueta en español e inglés (el panel es bilingüe).

import type { AdminLang } from "./admin-lang";

type Option = { id: string; label: string; labelEn: string };
const labelIn = (list: readonly Option[], id: string, lang: AdminLang) => {
  const found = list.find((o) => o.id === id);
  if (!found) return id;
  return lang === "en" ? found.labelEn : found.label;
};

/** Qué tipo de creador es (puede ser varios). La comunidad es para creadores de todo tipo, no solo UGC. */
export const CREATOR_TYPES = [
  { id: "youtube", label: "YouTube", labelEn: "YouTube" },
  { id: "tiktok", label: "TikTok", labelEn: "TikTok" },
  { id: "instagram", label: "Instagram", labelEn: "Instagram" },
  { id: "facebook", label: "Facebook", labelEn: "Facebook" },
  { id: "podcast", label: "Podcast", labelEn: "Podcast" },
  { id: "streaming", label: "Streaming (Twitch, Kick)", labelEn: "Streaming (Twitch, Kick)" },
  { id: "ugc", label: "UGC", labelEn: "UGC" },
  { id: "fotografia", label: "Fotografía", labelEn: "Photography" },
  { id: "escritura", label: "Blog y escritura", labelEn: "Blog & writing" },
  { id: "x_threads", label: "X / Threads", labelEn: "X / Threads" },
  { id: "linkedin", label: "LinkedIn", labelEn: "LinkedIn" },
  { id: "otro", label: "Otro", labelEn: "Other" },
] as const satisfies readonly Option[];
export type CreatorType = (typeof CREATOR_TYPES)[number]["id"];

/** Tipos de publicación del muro, con una idea de qué escribir en cada uno. */
export const POST_KINDS = [
  {
    id: "pregunta",
    label: "Pregunta",
    labelEn: "Question",
    hint: "Pide ayuda: ¿cuánto cobrar?, ¿cómo responder a una marca?, ¿qué app usas para editar?",
    hintEn: "Ask for help: how much to charge? how to reply to a brand? what app do you edit with?",
  },
  {
    id: "consejo",
    label: "Consejo",
    labelEn: "Tip",
    hint: "Comparte algo que te funcionó: un gancho, una plantilla, cómo negociaste.",
    hintEn: "Share something that worked for you: a hook, a template, how you negotiated.",
  },
  {
    id: "logro",
    label: "Logro",
    labelEn: "Win",
    hint: "Celebra: tu primera marca pagada, 10K seguidores, un video que despegó.",
    hintEn: "Celebrate: your first paid brand, 10K followers, a video that took off.",
  },
  {
    id: "colaboracion",
    label: "Busco colaborar",
    labelEn: "Looking to collab",
    hint: "Busca con quién hacer un video, un podcast o una campaña juntos.",
    hintEn: "Find someone to make a video, a podcast or a campaign with.",
  },
  {
    id: "recurso",
    label: "Recurso",
    labelEn: "Resource",
    hint: "Una herramienta, curso, plantilla o lectura útil para otros creadores.",
    hintEn: "A tool, course, template or read that's useful for other creators.",
  },
] as const;
export type PostKind = (typeof POST_KINDS)[number]["id"];

export const TOPICS = [
  { id: "crecimiento", label: "Crecimiento", labelEn: "Growth" },
  { id: "marcas_y_dinero", label: "Marcas y dinero", labelEn: "Brands & money" },
  { id: "contenido_y_edicion", label: "Contenido y edición", labelEn: "Content & editing" },
  { id: "herramientas", label: "Herramientas", labelEn: "Tools" },
  { id: "bienestar", label: "Bienestar", labelEn: "Wellbeing" },
  { id: "legal_e_impuestos", label: "Legal e impuestos", labelEn: "Legal & taxes" },
  { id: "otro", label: "Otro", labelEn: "Other" },
] as const satisfies readonly Option[];
export type Topic = (typeof TOPICS)[number]["id"];

export const REPORT_REASONS = [
  { id: "spam", label: "Spam o ventas no pedidas", labelEn: "Spam or unsolicited selling" },
  { id: "ofensivo", label: "Ofensivo o acoso", labelEn: "Offensive or harassment" },
  { id: "estafa", label: "Posible estafa", labelEn: "Possible scam" },
  { id: "otro", label: "Otro motivo", labelEn: "Other reason" },
] as const satisfies readonly Option[];
export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((o) => o.id) as readonly string[];
export const isCreatorType = (v: unknown): v is CreatorType => typeof v === "string" && ids(CREATOR_TYPES).includes(v);
export const isPostKind = (v: unknown): v is PostKind => typeof v === "string" && ids(POST_KINDS).includes(v);
export const isTopic = (v: unknown): v is Topic => typeof v === "string" && ids(TOPICS).includes(v);
export const isReportReason = (v: unknown): v is ReportReason => typeof v === "string" && ids(REPORT_REASONS).includes(v);

export const creatorTypeLabel = (id: string, lang: AdminLang = "es") => labelIn(CREATOR_TYPES, id, lang);
export const postKindLabel = (id: string, lang: AdminLang = "es") => labelIn(POST_KINDS, id, lang);
export const topicLabel = (id: string, lang: AdminLang = "es") => labelIn(TOPICS, id, lang);
export const reportReasonLabel = (id: string, lang: AdminLang = "es") => labelIn(REPORT_REASONS, id, lang);

// ─── Reglas ───

export const LIMITS = {
  title: { min: 5, max: 140 },
  body: { min: 10, max: 5000 },
  reply: { min: 2, max: 3000 },
  /** Publicaciones por hora (y el primer día de una cuenta nueva). */
  postsPerHour: 5,
  postsFirstDay: 2,
  repliesPerHour: 30,
  reportsPerHour: 20,
  /** Minutos para editar después de publicar. */
  editMinutes: 30,
  /** Reportes abiertos que avisan al equipo / ocultan solo el contenido. */
  reportsToNotify: 3,
  reportsToAutoHide: 5,
  pageSize: 20,
} as const;

export const REPUTATION = { helpful: 2, bestAnswer: 10 } as const;

/** Niveles por reputación (nunca se resta por debajo de 0). */
export const LEVELS = [
  { id: "nuevo", min: 0, label: "Nuevo", labelEn: "New" },
  { id: "activo", min: 20, label: "Activo", labelEn: "Active" },
  { id: "aporta", min: 100, label: "Aporta", labelEn: "Contributor" },
  { id: "referente", min: 300, label: "Referente", labelEn: "Leader" },
] as const;

export function levelFor(reputation: number) {
  let level: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (reputation >= l.min) level = l;
  return level;
}

export const levelLabel = (reputation: number, lang: AdminLang = "es") => {
  const level = levelFor(reputation);
  return lang === "en" ? level.labelEn : level.label;
};

/**
 * Puntaje de "Destacadas": me sirvió + respuestas, con caída por antigüedad
 * (una publicación de hace 2 días vale la mitad que una de hoy con lo mismo).
 */
export function featuredScore(p: { helpfulCount: number; replyCount: number; createdAt: Date }, now = new Date()) {
  const hours = Math.max(0, (now.getTime() - p.createdAt.getTime()) / 3_600_000);
  return (p.helpfulCount * 2 + p.replyCount + 1) / Math.pow(1 + hours / 48, 1.5);
}

/** El autor puede editar su publicación o respuesta solo los primeros minutos. */
export function canEditWithin(createdAt: Date, now = new Date()) {
  return now.getTime() - createdAt.getTime() <= LIMITS.editMinutes * 60_000;
}

/** Cambio de reputación al dar o quitar un "me sirvió" (nunca queda en negativo). */
export function nextReputation(current: number, delta: number) {
  return Math.max(0, current + delta);
}

/** Tipos de creador según las redes conectadas y el tipo de cuenta (para armar el perfil la primera vez). */
export function creatorTypesFrom(platforms: string[], creatorKind: string | null | undefined): CreatorType[] {
  const found = new Set<CreatorType>();
  for (const p of platforms) if (isCreatorType(p)) found.add(p);
  if (creatorKind === "ugc" || creatorKind === "ambos") found.add("ugc");
  return CREATOR_TYPES.map((t) => t.id).filter((id) => found.has(id));
}

/** Las reglas cortas que se aceptan al entrar (la página completa llega en el paso 6). */
export const COMMUNITY_RULES = [
  {
    es: "Respeto siempre: aquí hay creadores de todos los tamaños, nichos y países.",
    en: "Always be respectful: there are creators of every size, niche and country here.",
  },
  {
    es: "Nada de spam ni ventas que nadie pidió.",
    en: "No spam or unsolicited selling.",
  },
  {
    es: "No compartas datos personales de otras personas (correos, teléfonos, direcciones).",
    en: "Don't share other people's personal data (emails, phones, addresses).",
  },
  {
    es: "Cero estafas: si algo huele raro, repórtalo.",
    en: "Zero scams: if something smells off, report it.",
  },
  {
    es: "El equipo de Foliocrew puede ocultar contenido o pausar cuentas que rompan estas reglas.",
    en: "The Foliocrew team can hide content or pause accounts that break these rules.",
  },
] as const;
