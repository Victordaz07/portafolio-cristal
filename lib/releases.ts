// Lanzamiento por temporadas: quién ve cada módulo del panel (Centro de mando → Lanzamientos).
// Este archivo es lógica pura (sin base de datos): el catálogo de módulos y las reglas. La lectura y
// el guardado están en lib/releases-server.ts. Cada módulo tiene tres posiciones:
//   off → nadie lo ve (sale del menú y su página da 404). Los datos de cada cuenta se guardan.
//   amb → solo las cuentas embajadoras, con la etiqueta «Acceso anticipado».
//   all → toda cuenta activa; si antes no lo era, lleva la etiqueta «Nuevo» unos días.
// Quien administra Foliocrew ve siempre todo (para poder revisarlo antes de soltarlo).

export const RELEASE_LEVELS = ["off", "amb", "all"] as const;
export type ReleaseLevel = (typeof RELEASE_LEVELS)[number];

export const isReleaseLevel = (v: unknown): v is ReleaseLevel => typeof v === "string" && (RELEASE_LEVELS as readonly string[]).includes(v);

/** Días que un módulo recién abierto a todos lleva la etiqueta «Nuevo». */
export const NEW_BADGE_DAYS = 14;

export interface ReleaseModule {
  id: string;
  season: 1 | 2 | 3 | 4;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  /** Aviso para el Centro de mando (por ejemplo, que necesita un permiso de Meta). */
  note?: string;
  noteEn?: string;
  /** Posición si nadie la ha cambiado todavía. */
  defaultLevel: ReleaseLevel;
  /** Páginas del panel que pertenecen al módulo (el menú y el bloqueo de páginas salen de aquí). */
  hrefs: string[];
}

export interface ReleaseSeason {
  id: 1 | 2 | 3 | 4;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
}

export const RELEASE_SEASONS: ReleaseSeason[] = [
  {
    id: 1,
    name: "La base",
    nameEn: "The basics",
    description: "Lo que hace falta para mostrar tu trabajo y cerrar un trato de principio a fin.",
    descriptionEn: "What you need to show your work and close a deal from start to finish.",
  },
  {
    id: 2,
    name: "Herramientas pro",
    nameEn: "Pro tools",
    description: "Primero para embajadores; después para todos. Cada una puede ser un anuncio de «nuevo este mes».",
    descriptionEn: "Ambassadors first, then everyone. Each one can be a “new this month” announcement.",
  },
  {
    id: 3,
    name: "Comunidad",
    nameEn: "Community",
    description: "Los embajadores la llenan primero, para que nadie entre a un muro vacío.",
    descriptionEn: "Ambassadors fill it first, so nobody walks into an empty wall.",
  },
  {
    id: 4,
    name: "Cuando haya aprobación o volumen",
    nameEn: "Once approved or with enough people",
    description: "Dependen de Meta, de llaves de configuración o de tener suficientes cuentas.",
    descriptionEn: "They depend on Meta, on configuration keys or on having enough accounts.",
  },
];

export const RELEASE_MODULES: ReleaseModule[] = [
  // ─── Temporada 1: la base ───
  {
    id: "sitio",
    season: 1,
    name: "Sitio público y portada",
    nameEn: "Public site and cover",
    description: "Portada (Hero), servicios, paquetes, FAQ, reseñas, testimonios, contacto, vista pública y dominio.",
    descriptionEn: "Cover (Hero), services, packages, FAQ, reviews, testimonials, contact, public view and domain.",
    note: "Apagarlo solo esconde los editores del panel: los sitios públicos siguen en línea.",
    noteEn: "Turning it off only hides the panel editors: public sites stay online.",
    defaultLevel: "all",
    hrefs: ["/admin/hero", "/admin/servicios", "/admin/paquetes", "/admin/faq", "/admin/contacto", "/admin/resenas", "/admin/testimonios", "/admin/vista-publica", "/admin/dominio"],
  },
  { id: "mediakit", season: 1, name: "Media kit", nameEn: "Media kit", description: "Cifras de la portada y media kit público con datos verificados.", descriptionEn: "Cover figures and public media kit with verified data.", defaultLevel: "all", hrefs: ["/admin/media-kit"] },
  { id: "linkbio", season: 1, name: "Link en bio", nameEn: "Link in bio", description: "Página de enlaces para la bio de Instagram y TikTok.", descriptionEn: "Links page for the Instagram and TikTok bio.", defaultLevel: "all", hrefs: ["/admin/enlaces"] },
  { id: "diseno", season: 1, name: "Estudio de diseño", nameEn: "Design studio", description: "Estilos, colores, tipografía y orden de las secciones.", descriptionEn: "Styles, colors, fonts and section order.", defaultLevel: "all", hrefs: ["/admin/apariencia"] },
  { id: "feed", season: 1, name: "Feed / Publicaciones", nameEn: "Feed / Posts", description: "Tarjetas de contenido con sus métricas.", descriptionEn: "Content cards with their metrics.", defaultLevel: "all", hrefs: ["/admin/feed"] },
  { id: "marcas", season: 1, name: "Marcas (CRM) y «¿Cuánto cobro?»", nameEn: "Brands (CRM) and “What should I charge?”", description: "Tratos, entregables, derechos de uso y calculadora de tarifas.", descriptionEn: "Deals, deliverables, usage rights and rate calculator.", defaultLevel: "all", hrefs: ["/admin/marcas"] },
  { id: "bandeja", season: 1, name: "Bandeja", nameEn: "Inbox", description: "Mensajes del formulario y comentarios de Instagram.", descriptionEn: "Form messages and Instagram comments.", defaultLevel: "all", hrefs: ["/admin/mensajes"] },
  { id: "calendario", season: 1, name: "Calendario y Crear con IA", nameEn: "Calendar and Create with AI", description: "Plan del mes y captions sugeridos por IA.", descriptionEn: "Monthly plan and AI-suggested captions.", defaultLevel: "all", hrefs: ["/admin/calendario", "/admin/crear"] },
  { id: "acuerdos", season: 1, name: "Acuerdos", nameEn: "Agreements", description: "Contrato simple con aceptación en línea.", descriptionEn: "Simple contract with online acceptance.", defaultLevel: "all", hrefs: ["/admin/contratos"] },
  { id: "facturas", season: 1, name: "Facturas", nameEn: "Invoices", description: "Facturas con enlace y recordatorio de cobro.", descriptionEn: "Invoices with a link and payment reminders.", defaultLevel: "all", hrefs: ["/admin/facturas"] },
  { id: "reportes", season: 1, name: "Reportes", nameEn: "Reports", description: "Crecimiento, mejor horario para publicar y reporte mensual.", descriptionEn: "Growth, best time to post and monthly report.", defaultLevel: "all", hrefs: ["/admin/reportes"] },
  { id: "conectar", season: 1, name: "Conectar cuentas", nameEn: "Connect accounts", description: "Instagram, Facebook, TikTok y YouTube.", descriptionEn: "Instagram, Facebook, TikTok and YouTube.", defaultLevel: "all", hrefs: ["/admin/conectar"] },

  // ─── Temporada 2: herramientas pro ───
  { id: "propuestas", season: 2, name: "Propuestas con IA", nameEn: "AI proposals", description: "Correo de propuesta a una marca, escrito con IA (dentro de Marcas).", descriptionEn: "Proposal email to a brand, written with AI (inside Brands).", defaultLevel: "amb", hrefs: [] },
  { id: "reciclar", season: 2, name: "Reciclar con IA", nameEn: "Recycle with AI", description: "Un video largo convertido en ganchos, textos y carrusel.", descriptionEn: "A long video turned into hooks, captions and a carousel.", defaultLevel: "amb", hrefs: ["/admin/reciclar"] },
  { id: "campanas", season: 2, name: "Reportes a marcas", nameEn: "Brand reports", description: "Reporte de campaña con resultados, listo para enviar.", descriptionEn: "Campaign report with results, ready to send.", defaultLevel: "amb", hrefs: ["/admin/campanas"] },
  { id: "ingresos", season: 2, name: "Mis ingresos", nameEn: "My income", description: "Ingresos, gastos y cuánto apartar para impuestos.", descriptionEn: "Income, expenses and how much to set aside for taxes.", defaultLevel: "amb", hrefs: ["/admin/ingresos"] },
  { id: "tienda", season: 2, name: "Tienda", nameEn: "Shop", description: "Productos digitales, asesorías y afiliados sin comisión.", descriptionEn: "Digital products, consultations and affiliates, commission-free.", defaultLevel: "amb", hrefs: ["/admin/tienda"] },
  { id: "bienestar", season: 2, name: "Bienestar", nameEn: "Wellbeing", description: "Carga de trabajo, modo descanso y banco de contenido.", descriptionEn: "Workload, rest mode and content bank.", defaultLevel: "amb", hrefs: ["/admin/bienestar"] },
  { id: "metas", season: 2, name: "Metas y plan", nameEn: "Goals and plan", description: "Metas con progreso y plan de la semana.", descriptionEn: "Goals with progress and a weekly plan.", defaultLevel: "amb", hrefs: ["/admin/metas"] },
  { id: "bitacora", season: 2, name: "Bitácora", nameEn: "Journal", description: "Hitos, aprendizajes y racha.", descriptionEn: "Milestones, lessons and streak.", defaultLevel: "amb", hrefs: ["/admin/bitacora"] },

  // ─── Temporada 3: comunidad ───
  { id: "muro", season: 3, name: "Muro", nameEn: "Wall", description: "Preguntas, consejos, logros y búsqueda de colaboraciones.", descriptionEn: "Questions, tips, wins and collaboration requests.", defaultLevel: "amb", hrefs: ["/admin/comunidad"] },
  { id: "buscar", season: 3, name: "Buscar creadores", nameEn: "Find creators", description: "Por nicho, idioma, ciudad y si está abierto a colaborar.", descriptionEn: "By niche, language, city and whether they're open to collaborate.", defaultLevel: "amb", hrefs: ["/admin/comunidad/creadores", "/admin/comunidad/creador"] },
  { id: "mensajes", season: 3, name: "Conexiones y mensajes", nameEn: "Connections and messages", description: "Conversaciones privadas entre creadores conectados.", descriptionEn: "Private conversations between connected creators.", defaultLevel: "off", hrefs: ["/admin/comunidad/mensajes", "/admin/comunidad/conexiones"] },
  { id: "circulos", season: 3, name: "Círculos", nameEn: "Circles", description: "Grupos pequeños por nicho, red o nivel.", descriptionEn: "Small groups by niche, network or level.", defaultLevel: "off", hrefs: ["/admin/comunidad/circulos"] },
  { id: "sesiones", season: 3, name: "Sesiones en vivo", nameEn: "Live sessions", description: "Charlas y mentorías en grupo.", descriptionEn: "Group talks and mentoring.", defaultLevel: "off", hrefs: ["/admin/comunidad/sesiones"] },

  // ─── Temporada 4: cuando haya aprobación o volumen ───
  {
    id: "autopublicar",
    season: 4,
    name: "Publicación automática",
    nameEn: "Auto-publishing",
    description: "Publicar en Instagram y Facebook desde el calendario (opción dentro de Crear).",
    descriptionEn: "Publish to Instagram and Facebook from the calendar (option inside Create).",
    note: "Necesita la aprobación de Meta y PUBLISH_INSTAGRAM_ENABLED / PUBLISH_FACEBOOK_ENABLED. Sin eso, encenderlo no muestra nada.",
    noteEn: "Needs Meta's approval and PUBLISH_INSTAGRAM_ENABLED / PUBLISH_FACEBOOK_ENABLED. Without them, turning it on shows nothing.",
    defaultLevel: "off",
    hrefs: [],
  },
  {
    id: "comentariodm",
    season: 4,
    name: "Comentario → DM",
    nameEn: "Comment → DM",
    description: "Mensaje automático a quien comenta una palabra.",
    descriptionEn: "Automatic message to whoever comments a word.",
    note: "Necesita el permiso de mensajes de Instagram (INSTAGRAM_DM_ENABLED). Sin eso, se ven las reglas pero no se envía nada.",
    noteEn: "Needs Instagram's messaging permission (INSTAGRAM_DM_ENABLED). Without it, rules show but nothing is sent.",
    defaultLevel: "off",
    hrefs: ["/admin/comentario-dm"],
  },
  {
    id: "avisos",
    season: 4,
    name: "Avisos en el celular",
    nameEn: "Phone notices",
    description: "Notificaciones de pagos, entregas y respuestas.",
    descriptionEn: "Notifications about payments, deliveries and replies.",
    note: "Necesita las llaves VAPID en Vercel. Sin ellas, la pantalla dice que los avisos no están activos.",
    noteEn: "Needs the VAPID keys in Vercel. Without them, the screen says notices aren't active.",
    defaultLevel: "off",
    hrefs: ["/admin/notificaciones"],
  },
  {
    id: "resenasmarcas",
    season: 4,
    name: "Reseñas de marcas",
    nameEn: "Brand reviews",
    description: "Reseñas anónimas entre creadores.",
    descriptionEn: "Anonymous reviews between creators.",
    note: "Una marca solo aparece con reseñas de 3 creadores distintos: sirve cuando haya volumen.",
    noteEn: "A brand only shows with reviews from 3 different creators: useful once there's volume.",
    defaultLevel: "off",
    hrefs: ["/admin/resenas-marcas"],
  },
];

export type ReleaseModuleId = (typeof RELEASE_MODULES)[number]["id"];

export const releaseModule = (id: string) => RELEASE_MODULES.find((m) => m.id === id);

/** Módulos de la comunidad: «Mi perfil» y las reglas se ven si al menos uno de estos se ve. */
export const COMMUNITY_MODULES = ["muro", "buscar", "mensajes", "circulos", "sesiones"];

export interface ReleaseState {
  level: ReleaseLevel;
  /** Cuándo pasó a «Todos» (para la etiqueta «Nuevo»). */
  publicAt: Date | null;
}

export type ReleaseMap = Record<string, ReleaseState>;

/** Junta lo guardado con las posiciones por defecto. Lo guardado con un valor raro se ignora. */
export function resolveReleases(rows: { id: string; level: string; publicAt: Date | null }[]): ReleaseMap {
  const map: ReleaseMap = {};
  for (const m of RELEASE_MODULES) map[m.id] = { level: m.defaultLevel, publicAt: null };
  for (const row of rows) {
    if (map[row.id] && isReleaseLevel(row.level)) map[row.id] = { level: row.level, publicAt: row.publicAt };
  }
  return map;
}

export interface Viewer {
  ambassador: boolean;
  /** Quien administra Foliocrew: lo ve todo. */
  platformAdmin: boolean;
}

/** ¿Esta cuenta puede usar este nivel? Un módulo desconocido se ve (no esconder por error). */
export function canSee(level: ReleaseLevel | undefined, viewer: Viewer) {
  if (!level || level === "all" || viewer.platformAdmin) return true;
  return level === "amb" && viewer.ambassador;
}

export function moduleVisible(map: ReleaseMap, id: string, viewer: Viewer) {
  return canSee(map[id]?.level, viewer);
}

/** ¿Lleva la etiqueta «Nuevo»? Solo si está para todos y pasó a «Todos» hace menos de NEW_BADGE_DAYS. */
export function isNewRelease(state: ReleaseState | undefined, now = new Date()) {
  if (!state || state.level !== "all" || !state.publicAt) return false;
  const age = now.getTime() - state.publicAt.getTime();
  return age >= 0 && age < NEW_BADGE_DAYS * 86_400_000;
}

/** Al cambiar de nivel: la fecha de «Nuevo» se marca solo al pasar a «Todos» desde otra posición. */
export function nextPublicAt(previous: ReleaseState | undefined, level: ReleaseLevel, now = new Date()) {
  if (level !== "all") return null;
  if (previous?.level === "all") return previous.publicAt;
  return now;
}

/** El módulo dueño de una página del panel (la ruta más específica gana). */
export function moduleForHref(href: string) {
  let best: { id: string; length: number } | null = null;
  for (const m of RELEASE_MODULES) {
    for (const h of m.hrefs) {
      const matches = href === h || href.startsWith(`${h}/`);
      if (matches && (!best || h.length > best.length)) best = { id: m.id, length: h.length };
    }
  }
  return best?.id ?? null;
}

export type NavTag = "early" | "new" | "off" | null;

/**
 * Cómo se ve una entrada del menú para esta cuenta: escondida, o con qué etiqueta.
 * «Mi perfil» de la comunidad sigue a los módulos de la comunidad. Lo que no es de ningún módulo se ve sin etiqueta.
 */
export function navEntry(href: string, map: ReleaseMap, viewer: Viewer, now = new Date()): { hidden: boolean; tag: NavTag } {
  const id = href === "/admin/comunidad/perfil" ? null : moduleForHref(href);
  if (href === "/admin/comunidad/perfil") {
    const anyCommunity = COMMUNITY_MODULES.some((m) => moduleVisible(map, m, viewer));
    return { hidden: !anyCommunity, tag: null };
  }
  if (!id) return { hidden: false, tag: null };
  const state = map[id];
  if (!canSee(state?.level, viewer)) return { hidden: true, tag: null };
  if (state?.level === "off") return { hidden: false, tag: "off" }; // solo lo ve quien administra
  if (state?.level === "amb") return { hidden: false, tag: "early" };
  return { hidden: false, tag: isNewRelease(state, now) ? "new" : null };
}

/** Cuántos módulos hay en cada posición (para el resumen del Centro de mando). */
export function levelCounts(map: ReleaseMap) {
  const counts: Record<ReleaseLevel, number> = { off: 0, amb: 0, all: 0 };
  for (const m of RELEASE_MODULES) counts[map[m.id]?.level ?? m.defaultLevel]++;
  return counts;
}

export const levelLabel = (level: ReleaseLevel, lang: "es" | "en" = "es") =>
  lang === "en" ? { off: "Off", amb: "Ambassadors", all: "Everyone" }[level] : { off: "Apagado", amb: "Embajadores", all: "Todos" }[level];
