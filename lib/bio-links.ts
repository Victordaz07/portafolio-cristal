import { z } from "zod";

// Enlaces de la página "link en bio" (/enlaces). Solo http(s) o mailto: nada de javascript: ni rutas raras.
export const MAX_LINKS = 30;
/** Clics mínimos para que el enlace más visitado muestre "Más clics". */
export const POPULAR_MIN_CLICKS = 10;

export const linkUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^(https?:\/\/|mailto:)/i.test(v), "El enlace tiene que empezar con https://");

const short = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const linkSchema = z.object({
  title: z.string().trim().min(1, "Escribe un título").max(80),
  titleEn: short(80),
  url: linkUrl,
  imageUrl: z.union([z.string().url(), z.string().regex(/^\/[^\s]*$/), z.literal("")]).nullable().optional(),
  pill: short(14),
  wide: z.boolean().default(true),
  section: short(40),
  sectionEn: short(40),
  kicker: short(18),
  kickerEn: short(18),
  badge: short(18),
  badgeEn: short(18),
});

/** Campos de texto opcionales: "" se guarda como null. */
export const OPTIONAL_TEXT = ["titleEn", "imageUrl", "pill", "sectionEn", "kicker", "kickerEn", "badge", "badgeEn"] as const;

// ─── Fondos de la página ───
// Patrones en SVG usados como máscara: se pintan con el color de acento de cada perfil.
const svg = (body: string, size = 260) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`)}")`;

const petal = (x: number, y: number, r: number) =>
  Array.from({ length: 5 }, (_, i) => `<ellipse cx='${x}' cy='${y - r}' rx='${r * 0.45}' ry='${r}' transform='rotate(${i * 72} ${x} ${y})'/>`).join("") +
  `<circle cx='${x}' cy='${y}' r='${r * 0.35}' fill='white'/>`;

const sprig = (x: number, y: number, rot: number) =>
  `<g transform='translate(${x} ${y}) rotate(${rot})' fill='black'><path d='M0 0 C2 -14 2 -28 0 -40' stroke='black' stroke-width='1.6' fill='none'/>` +
  [-10, -20, -30].map((yy, i) => `<ellipse cx='${i % 2 ? 6 : -6}' cy='${yy}' rx='6' ry='3' transform='rotate(${i % 2 ? -30 : 30} ${i % 2 ? 6 : -6} ${yy})'/>`).join("") +
  `</g>`;

export const LINK_PATTERNS = {
  blobs: { label: "Ninguno (blobs difuminados)", mask: null as string | null, size: 0 },
  acuarela: {
    label: "Blobs acuarela",
    mask: svg(
      `<path d='M40 30c22-14 52-4 56 18s-14 40-36 40-40-10-42-28 6-24 22-30z' opacity='0.8'/>` +
        `<path d='M170 120c18-10 46-2 50 18s-10 34-30 36-38-8-40-24 4-22 20-30z' opacity='0.6'/>` +
        `<path d='M60 190c14-8 34-2 36 12s-8 24-22 24-26-6-26-18 2-14 12-18z' opacity='0.7'/>` +
        `<circle cx='215' cy='40' r='14' opacity='0.5'/><circle cx='120' cy='95' r='8' opacity='0.6'/>`
    ),
    size: 260,
  },
  punteado: {
    label: "Punteado",
    mask: svg(Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => `<circle cx='${c * 26 + (r % 2 ? 13 : 0)}' cy='${r * 26}' r='2'/>`).join("")).join("")),
    size: 260,
  },
  petalos: { label: "Pétalos", mask: svg(petal(50, 60, 14) + petal(180, 40, 10) + petal(120, 150, 16) + petal(30, 210, 9) + petal(215, 200, 12)), size: 260 },
  ramitas: { label: "Ramitas (sprigs)", mask: svg(sprig(40, 90, -20) + sprig(170, 70, 25) + sprig(110, 200, -5) + sprig(230, 230, 40)), size: 260 },
  enredadera: {
    label: "Enredadera",
    mask: svg(
      `<path d='M0 130 C40 90 90 170 130 130 S220 90 260 130' stroke='black' stroke-width='1.8' fill='none'/>` +
        [30, 80, 130, 180, 230]
          .map((x, i) => `<ellipse cx='${x}' cy='${i % 2 ? 150 : 110}' rx='9' ry='4.5' transform='rotate(${i % 2 ? 35 : -35} ${x} ${i % 2 ? 150 : 110})'/>`)
          .join("") +
        `<circle cx='60' cy='40' r='3'/><circle cx='200' cy='220' r='3'/>`
    ),
    size: 260,
  },
} as const;
export type LinkPatternId = keyof typeof LINK_PATTERNS;

/** Fondos pintados a mano (public/backgrounds, 960px en WebP; mosaico de 640px como pide el README del diseño). */
const PATTERN_FILES: Partial<Record<LinkPatternId, string>> = {
  acuarela: "blobs",
  punteado: "punteado",
  petalos: "petalos",
  ramitas: "sprigs",
  enredadera: "enredadera",
};
const PAINTED_ACCENTS = ["lila", "rosa", "terracota", "salvia", "azul", "dorado"];

/**
 * La imagen del fondo para un acento de los 6 presets (o null: color propio o estilo oscuro → patrón SVG teñido,
 * porque las imágenes traen el fondo crema).
 */
export function patternImage(pattern: LinkPatternId, accent: string, opts: { dark?: boolean; mini?: boolean } = {}) {
  const file = PATTERN_FILES[pattern];
  if (!file || opts.dark || !PAINTED_ACCENTS.includes(accent)) return null;
  return `/backgrounds/${opts.mini ? "mini/" : ""}bg-${file}-${accent}.webp`;
}
/** Tamaño del mosaico y opacidad final sobre el crema del sitio. */
export const PATTERN_TILE = 640;
export const PATTERN_IMAGE_OPACITY = 0.15;
export const isLinkPattern = (v: unknown): v is LinkPatternId => typeof v === "string" && v in LINK_PATTERNS;

// ─── Ícono automático según el enlace ───
export type LinkIconKind = "paypal" | "social" | "mail" | "whatsapp" | "shop" | "generic";

export function iconKindForUrl(url: string): LinkIconKind {
  const u = url.toLowerCase();
  if (u.startsWith("mailto:")) return "mail";
  if (/paypal\.(me|com)|venmo|cash\.app|ko-fi|buymeacoffee/.test(u)) return "paypal";
  if (/wa\.me|whatsapp/.test(u)) return "whatsapp";
  if (/tiktok\.com|instagram\.com|youtube\.com|youtu\.be|facebook\.com|pinterest\./.test(u)) return "social";
  if (/amazon\.|amzn\.|temu\.|shein\.|shop|tienda|store/.test(u)) return "shop";
  return "generic";
}

/** Agrupa los enlaces por sección, en el orden en que aparecen. */
export function groupLinks<T extends { section: string; sectionEn: string | null }>(links: T[], locale: "es" | "en", fallback: string) {
  const groups: { key: string; title: string; items: T[] }[] = [];
  for (const link of links) {
    const key = link.section.trim().toLowerCase();
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const title = (locale === "en" && link.sectionEn) || link.section || fallback;
      group = { key, title, items: [] };
      groups.push(group);
    }
    group.items.push(link);
  }
  return groups;
}
