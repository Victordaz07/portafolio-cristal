import { NETWORK_META, type PlanNetwork } from "./content-plan";

// Aviso de publicidad (B5): si una publicación es para una marca, el texto debe decir que es publicidad
// y se tiene que ver ANTES del "ver más" (la FTC pide que sea claro y visible, no escondido al final).
// Todo es función pura (se prueba en tests/disclosure.test.ts). No es asesoría legal.

type Lang = "es" | "en";

/** Cuántos caracteres se ven como máximo antes del "ver más". */
export const DISCLOSURE_WINDOW = 125;

/** Hashtags que dejan claro que es publicidad. */
const CLEAR_TAGS = new Set(["ad", "ads", "advertisement", "sponsored", "paidpartnership", "paidpromotion", "publicidad", "anuncio", "patrocinado", "patrocinio", "publi"]);
/** Hashtags que NO bastan solos: no dicen claramente que hay un pago o un acuerdo. */
const WEAK_TAGS = new Set(["collab", "colab", "colaboracion", "sp", "partner", "ambassador", "embajador", "embajadora", "gifted", "regalo", "thanks", "gracias"]);
/** Frases (en minúsculas) que también lo dejan claro, con o sin hashtag. */
const CLEAR_PHRASES = [
  /publicidad/,
  /patrocinado por/,
  /contenido patrocinado/,
  /colaboraci[oó]n pagada/,
  /colaboraci[oó]n patrocinada/,
  /promoci[oó]n pagada/,
  /paid partnership/,
  /paid promotion/,
  /sponsored by/,
  /sponsored content/,
];

const normalize = (tag: string) => tag.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export type DisclosureStatus =
  /** No hay texto todavía. */
  | "empty"
  /** Hay un aviso claro y se ve antes del "ver más". */
  | "ok"
  /** No hay ningún aviso. */
  | "missing"
  /** Hay un aviso, pero queda después del "ver más". */
  | "late"
  /** Solo hay un hashtag ambiguo (#collab, #colaboración…). */
  | "weak";

export interface DisclosureCheck {
  status: DisclosureStatus;
  /** Dónde empieza el primer aviso claro (null si no hay). */
  index: number | null;
  /** Caracteres visibles antes del "ver más" en las redes elegidas. */
  window: number;
}

/** Los caracteres que se ven antes de "ver más": el menor de las redes elegidas (máximo 125). */
export function visibleWindow(networks: PlanNetwork[]) {
  const sizes = networks.map((n) => NETWORK_META[n].previewChars);
  return Math.min(DISCLOSURE_WINDOW, ...sizes);
}

type Match = { index: number; length: number; kind: "tag" | "phrase" };

/** Todos los hashtags del texto con su posición (letras con acento incluidas, igual que planWarnings). */
function hashtags(caption: string) {
  const found: { text: string; index: number }[] = [];
  const re = /#[\w\u00C0-\u024F]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(caption))) found.push({ text: m[0], index: m.index });
  return found;
}

function findClear(caption: string): Match | null {
  const matches: Match[] = [];
  for (const tag of hashtags(caption)) {
    if (CLEAR_TAGS.has(normalize(tag.text.slice(1)))) matches.push({ index: tag.index, length: tag.text.length, kind: "tag" });
  }
  const lower = caption.toLowerCase();
  for (const re of CLEAR_PHRASES) {
    const m = re.exec(lower);
    if (m) matches.push({ index: m.index, length: m[0].length, kind: "phrase" });
  }
  return matches.sort((a, b) => a.index - b.index)[0] ?? null;
}

function hasWeak(caption: string) {
  return hashtags(caption).some((tag) => WEAK_TAGS.has(normalize(tag.text.slice(1))));
}

export function checkDisclosure(caption: string, networks: PlanNetwork[]): DisclosureCheck {
  const window = visibleWindow(networks);
  if (!caption.trim()) return { status: "empty", index: null, window };
  const clear = findClear(caption);
  if (!clear) return { status: hasWeak(caption) ? "weak" : "missing", index: null, window };
  return { status: clear.index + clear.length <= window ? "ok" : "late", index: clear.index, window };
}

/** El hashtag que se sugiere según el idioma del texto. */
export const suggestedTag = (lang: Lang) => (lang === "en" ? "#ad" : "#publicidad");

/** Agrega el aviso al inicio del texto. */
export function addDisclosure(caption: string, lang: Lang) {
  const body = caption.trimStart();
  return body ? `${suggestedTag(lang)} ${body}` : `${suggestedTag(lang)} `;
}

/** Mueve el aviso que ya existe al inicio (si es un hashtag); si es una frase, agrega uno al inicio. */
export function moveDisclosureToStart(caption: string, lang: Lang) {
  const clear = findClear(caption);
  if (!clear || clear.kind !== "tag") return addDisclosure(caption, lang);
  const tag = caption.slice(clear.index, clear.index + clear.length);
  // Se quita el hashtag de donde estaba (con un espacio de al lado) y se pone al inicio.
  const before = caption.slice(0, clear.index).replace(/[ \t]+$/, "");
  const after = caption.slice(clear.index + clear.length).replace(/^[ \t]+/, "");
  const rest = [before, after].filter(Boolean).join(before && after && !before.endsWith("\n") ? " " : "");
  return `${tag} ${rest.trimStart()}`.trimEnd();
}

export interface NetworkTool {
  network: PlanNetwork;
  label: string;
  tip: string;
}

/** La herramienta de "contenido de marca" que tiene cada red (ayuda, pero no reemplaza el aviso en el texto). */
export function brandedContentTools(networks: PlanNetwork[], lang: Lang): NetworkTool[] {
  const es = lang === "es";
  const tools: Record<PlanNetwork, string> = {
    instagram: es ? "Activa la etiqueta «Colaboración pagada» al publicar." : "Turn on the “Paid partnership” label when you post.",
    tiktok: es ? "Activa «Divulgación de contenido» y marca «Contenido de marca»." : "Turn on “Content disclosure” and choose “Branded content”.",
    youtube: es ? "Marca «Incluye promoción pagada» en los detalles del video." : "Check “Includes paid promotion” in the video details.",
    facebook: es ? "Usa la etiqueta de colaboración pagada o contenido de marca." : "Use the paid partnership / branded content label.",
  };
  return networks.map((network) => ({ network, label: NETWORK_META[network].label, tip: tools[network] }));
}

/** ¿Hay que avisarle algo? (para marcar la publicación en el calendario). Solo cuenta si es para una marca. */
export function needsDisclosureFix(caption: string, networks: PlanNetwork[], hasBrand: boolean) {
  if (!hasBrand) return false;
  const { status } = checkDisclosure(caption, networks);
  return status === "missing" || status === "late" || status === "weak";
}
