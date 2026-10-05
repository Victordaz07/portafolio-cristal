import { ACCENTS, accentVars, isAccentId, isHexColor, resolvePalette, shade } from "./theme";
import { isLinkPattern, type LinkPatternId } from "./bio-links";

// ─── Estudio de diseño ───
// Cada perfil elige entre opciones cerradas (nunca CSS libre): así ningún sitio queda roto o ilegible.
// Las opciones se traducen a variables CSS que solo se aplican al sitio público (el panel no cambia).

type Rgb = string; // "#RRGGBB"

export interface StyleDef {
  label: string;
  description: string;
  colors: { bg: Rgb; surface: Rgb; ink: Rgb; inverse: Rgb; inverseDeep: Rgb };
  /** Sitios oscuros: los textos en acento oscuro pasan al acento claro para que se lean. */
  dark?: boolean;
  /** Lo que se elige junto con el estilo (cada cosa se puede cambiar después). */
  defaults: { font: FontId; corners: CornerId; background: BackgroundId; hero: HeroId };
}

export const STYLES = {
  editorial: {
    label: "Editorial",
    description: "Crema, serif elegante y detalles finos (el original).",
    colors: { bg: "#FBF7F5", surface: "#FFFFFF", ink: "#241227", inverse: "#4B5320", inverseDeep: "#2B3013" },
    defaults: { font: "editorial", corners: "suave", background: "textura", hero: "split" },
  },
  minimal: {
    label: "Minimal",
    description: "Blanco, aire y tipografía moderna.",
    colors: { bg: "#FFFFFF", surface: "#F5F5F3", ink: "#1C1C1C", inverse: "#1C1C1C", inverseDeep: "#000000" },
    defaults: { font: "moderna", corners: "recto", background: "liso", hero: "centered" },
  },
  noche: {
    label: "Noche",
    description: "Oscuro y elegante; las fotos resaltan.",
    colors: { bg: "#15111A", surface: "#211B28", ink: "#F4EEF3", inverse: "#EFE7F1", inverseDeep: "#CFC2D4" },
    dark: true,
    defaults: { font: "elegante", corners: "suave", background: "degradado", hero: "cover" },
  },
  soft: {
    label: "Soft",
    description: "Pastel, redondeado y cercano.",
    colors: { bg: "#FDF3F6", surface: "#FFFFFF", ink: "#3A2A3F", inverse: "#7A5C86", inverseDeep: "#4F3A58" },
    defaults: { font: "divertida", corners: "redondo", background: "degradado", hero: "centered" },
  },
  bold: {
    label: "Bold",
    description: "Contraste fuerte y titulares grandes.",
    colors: { bg: "#F4F1EA", surface: "#FFFFFF", ink: "#111111", inverse: "#111111", inverseDeep: "#000000" },
    defaults: { font: "impacto", corners: "recto", background: "liso", hero: "magazine" },
  },
} satisfies Record<string, StyleDef>;
export type StyleId = keyof typeof STYLES;

export interface FontDef {
  label: string;
  hint: string;
  /** Variables de next/font (app/layout.tsx) para cada papel. */
  display: string; // nombre y titular de portada
  heading: string; // títulos de sección
  body: string; // textos
  headingStyle: "italic" | "normal";
  headingCase: "uppercase" | "none";
  headingWeight: number;
}

export const FONTS = {
  editorial: { label: "Editorial", hint: "Fraunces + Bodoni", display: "--font-fraunces", heading: "--font-bodoni", body: "--font-inter", headingStyle: "italic", headingCase: "uppercase", headingWeight: 700 },
  elegante: { label: "Elegante", hint: "Playfair Display", display: "--font-playfair", heading: "--font-playfair", body: "--font-inter", headingStyle: "italic", headingCase: "none", headingWeight: 600 },
  moderna: { label: "Moderna", hint: "Space Grotesk + DM Sans", display: "--font-grotesk", heading: "--font-grotesk", body: "--font-dmsans", headingStyle: "normal", headingCase: "none", headingWeight: 700 },
  clasica: { label: "Clásica", hint: "Cormorant Garamond", display: "--font-cormorant", heading: "--font-cormorant", body: "--font-inter", headingStyle: "italic", headingCase: "none", headingWeight: 600 },
  divertida: { label: "Divertida", hint: "Fredoka + Nunito", display: "--font-fredoka", heading: "--font-fredoka", body: "--font-nunito", headingStyle: "normal", headingCase: "none", headingWeight: 600 },
  impacto: { label: "Impacto", hint: "Archivo en negrita", display: "--font-archivo", heading: "--font-archivo", body: "--font-dmsans", headingStyle: "normal", headingCase: "uppercase", headingWeight: 900 },
} satisfies Record<string, FontDef>;
export type FontId = keyof typeof FONTS;

export const CORNERS = {
  recto: { label: "Rectos", scale: 0.15, button: "4px" },
  suave: { label: "Suaves", scale: 1, button: "9999px" },
  redondo: { label: "Redondos", scale: 2, button: "9999px" },
} as const;
export type CornerId = keyof typeof CORNERS;

/** Fondos del sitio: lisos, la textura de estrellitas teñida y los 5 botánicos pintados (lib/bio-links.ts). */
export const BACKGROUNDS = {
  liso: { label: "Liso" },
  textura: { label: "Estrellitas" },
  degradado: { label: "Degradado" },
  acuarela: { label: "Acuarela" },
  punteado: { label: "Punteado" },
  petalos: { label: "Pétalos" },
  ramitas: { label: "Ramitas" },
  enredadera: { label: "Enredadera" },
} as const;

/**
 * Color secundario: el de los bloques y botones oscuros ("Por qué yo", "Colaboremos", etiquetas del contacto).
 * "acento" lo saca del color de acento (cambia junto con él); "estilo" usa el del estilo elegido.
 */
export const SECONDARY = {
  acento: { label: "Del acento", hint: "Cambia junto con tu color" },
  oliva: { label: "Oliva", hint: "El verde original" },
  tinta: { label: "Tinta", hint: "Casi negro, elegante" },
  estilo: { label: "Del estilo", hint: "El que trae el estilo" },
} as const;
export type SecondaryId = keyof typeof SECONDARY;
export type BackgroundId = keyof typeof BACKGROUNDS;

export const HEROES = {
  split: { label: "Foto a un lado", hint: "Texto a la izquierda, foto grande a la derecha" },
  cover: { label: "Foto de fondo", hint: "Tu foto ocupa toda la portada" },
  centered: { label: "Centrada", hint: "Foto en círculo y todo al centro" },
  magazine: { label: "Revista", hint: "Tu nombre gigante, como portada de revista" },
} as const;
export type HeroId = keyof typeof HEROES;

/** Secciones que se pueden ordenar u ocultar (la portada va siempre arriba y el contacto abajo). */
export const SECTIONS = {
  contenido: "Contenido (Feed)",
  colaboraciones: "Colaboraciones",
  marcas: "Marcas",
  resenas: "Reseñas",
  servicios: "Servicios",
  paquetes: "Paquetes",
  testimonios: "Testimonios",
  why: "Por qué yo",
  faq: "Preguntas frecuentes",
} as const;
export type SectionId = keyof typeof SECTIONS;
export const SECTION_IDS = Object.keys(SECTIONS) as SectionId[];

export interface SectionEntry {
  id: SectionId;
  hidden: boolean;
}

export interface Design {
  style: StyleId;
  font: FontId;
  accent: string; // id de ACCENTS o "custom"
  customAccent: string | null;
  corners: CornerId;
  background: BackgroundId;
  hero: HeroId;
  sections: SectionEntry[];
  /** Fondo decorativo del link en bio (lib/bio-links.ts → LINK_PATTERNS). */
  pattern: LinkPatternId;
  secondary: SecondaryId;
}

const has = <T extends object>(obj: T, key: unknown): key is keyof T => typeof key === "string" && key in obj;

/** Orden completo y válido: respeta el guardado y agrega al final las secciones que falten. */
export function normalizeSections(value: unknown): SectionEntry[] {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set<SectionId>();
  const out: SectionEntry[] = [];
  for (const item of list) {
    const id = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined;
    if (!has(SECTIONS, id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, hidden: Boolean((item as { hidden?: unknown }).hidden) });
  }
  for (const id of SECTION_IDS) if (!seen.has(id)) out.push({ id, hidden: false });
  return out;
}

export const DEFAULT_DESIGN: Design = {
  style: "editorial",
  font: "editorial",
  accent: "lila",
  customAccent: null,
  corners: "suave",
  background: "textura",
  hero: "split",
  sections: normalizeSections([]),
  pattern: "blobs",
  secondary: "acento",
};

/** Lee el diseño guardado (o uno de vista previa) y descarta cualquier valor que no sea una opción válida. */
export function parseDesign(raw: Partial<Record<keyof Design, unknown>> | null | undefined, base: Design = DEFAULT_DESIGN): Design {
  const r = raw ?? {};
  const customAccent = isHexColor(r.customAccent) ? (r.customAccent as string).toUpperCase() : base.customAccent;
  const accent = r.accent === "custom" ? (customAccent ? "custom" : base.accent) : isAccentId(r.accent as string) ? (r.accent as string) : base.accent;
  return {
    style: has(STYLES, r.style) ? r.style : base.style,
    font: has(FONTS, r.font) ? r.font : base.font,
    accent,
    customAccent,
    corners: has(CORNERS, r.corners) ? r.corners : base.corners,
    background: has(BACKGROUNDS, r.background) ? r.background : base.background,
    hero: has(HEROES, r.hero) ? r.hero : base.hero,
    sections: r.sections !== undefined ? normalizeSections(r.sections) : base.sections,
    pattern: isLinkPattern(r.pattern) ? r.pattern : base.pattern,
    secondary: has(SECONDARY, r.secondary) ? r.secondary : base.secondary,
  };
}

/** El diseño guardado en SiteSettings. */
export function designFromSettings(
  s: {
    themeStyle?: string | null;
    fontPair?: string | null;
    accentColor?: string | null;
    customAccent?: string | null;
    corners?: string | null;
    background?: string | null;
    heroLayout?: string | null;
    sectionLayout?: unknown;
    linksPattern?: string | null;
    secondaryColor?: string | null;
  } | null
): Design {
  if (!s) return DEFAULT_DESIGN;
  return parseDesign({
    style: s.themeStyle,
    font: s.fontPair,
    accent: s.accentColor,
    customAccent: s.customAccent,
    corners: s.corners,
    background: s.background,
    hero: s.heroLayout,
    sections: s.sectionLayout ?? undefined,
    pattern: s.linksPattern,
    secondary: s.secondaryColor,
  });
}

/** Vista previa del Estudio de diseño: ?disenio=<base64url de JSON>. Nunca se guarda, solo cambia cómo se ve. */
export function decodePreview(value: string | undefined | null): Partial<Record<keyof Design, unknown>> | null {
  if (!value || value.length > 4000) return null;
  try {
    const json = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return json && typeof json === "object" ? json : null;
  } catch {
    return null;
  }
}

export function encodePreview(design: Design) {
  const json = JSON.stringify(design);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function channels(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
}

/** Los 2 tonos del color secundario (bloques oscuros y botones) según la opción elegida. */
function secondaryColors(design: Design, style: StyleDef): { inverse: string; deep: string } {
  const palette = resolvePalette(design.accent, design.customAccent);
  switch (design.secondary) {
    case "acento":
      // En estilos claros, un tono profundo del acento; en oscuros, uno muy claro (el bloque se lee al revés).
      return style.dark ? { inverse: shade(palette.light, -0.45), deep: palette.light } : { inverse: shade(palette.dark, 0.3), deep: shade(palette.dark, 0.55) };
    case "oliva":
      return style.dark ? { inverse: "#DDE2BF", deep: "#B9C190" } : { inverse: "#4B5320", deep: "#2B3013" };
    case "tinta":
      return style.dark ? { inverse: "#F4EEF3", deep: "#CFC2D4" } : { inverse: "#241227", deep: "#120812" };
    default:
      return { inverse: style.colors.inverse, deep: style.colors.inverseDeep };
  }
}

/** Variables CSS del sitio público para un diseño (colores, acento, tipografías y bordes). */
export function designVars(design: Design): Record<string, string> {
  const style: StyleDef = STYLES[design.style];
  const font: FontDef = FONTS[design.font];
  const corners = CORNERS[design.corners];
  const accent = accentVars(design.accent, design.customAccent);
  const secondary = secondaryColors(design, style);
  return {
    ...accent,
    "--accent-deep": accent["--accent-dark"],
    // En sitios oscuros, el "acento oscuro" (etiquetas, textos) pasa a ser el claro para que se lea.
    ...(style.dark ? { "--accent-dark": accent["--accent-light"] } : {}),
    "--c-bg": channels(style.colors.bg),
    "--c-surface": channels(style.colors.surface),
    "--c-ink": channels(style.colors.ink),
    "--c-inverse": channels(secondary.inverse),
    "--c-inverse-deep": channels(secondary.deep),
    // Solo se reemplaza la fuente que cambia: "--font-x: var(--font-x)" sería un ciclo inválido.
    ...(font.display !== "--font-fraunces" ? { "--font-fraunces": `var(${font.display})` } : {}),
    ...(font.heading !== "--font-bodoni" ? { "--font-bodoni": `var(${font.heading})` } : {}),
    ...(font.body !== "--font-inter" ? { "--font-inter": `var(${font.body})` } : {}),
    "--heading-style": font.headingStyle,
    "--heading-case": font.headingCase,
    "--heading-weight": String(font.headingWeight),
    "--r-scale": String(corners.scale),
    "--r-btn": corners.button,
    colorScheme: style.dark ? "dark" : "light",
  };
}

export { ACCENTS };

// ─── Textos del Estudio de diseño en inglés (panel en inglés) ───
export const DESIGN_EN = {
  styles: {
    editorial: { label: "Editorial", description: "Cream, elegant serif and fine details (the original)." },
    minimal: { label: "Minimal", description: "White, airy and modern type." },
    noche: { label: "Night", description: "Dark and elegant; photos pop." },
    soft: { label: "Soft", description: "Pastel, rounded and friendly." },
    bold: { label: "Bold", description: "Strong contrast and big headlines." },
  } satisfies Record<StyleId, { label: string; description: string }>,
  fonts: {
    editorial: { label: "Editorial", hint: "Fraunces + Bodoni" },
    elegante: { label: "Elegant", hint: "Playfair Display" },
    moderna: { label: "Modern", hint: "Space Grotesk + DM Sans" },
    clasica: { label: "Classic", hint: "Cormorant Garamond" },
    divertida: { label: "Playful", hint: "Fredoka + Nunito" },
    impacto: { label: "Impact", hint: "Archivo Bold" },
  } satisfies Record<FontId, { label: string; hint: string }>,
  corners: { recto: "Sharp", suave: "Soft", redondo: "Round" } satisfies Record<CornerId, string>,
  backgrounds: {
    liso: "Plain",
    textura: "Little stars",
    degradado: "Gradient",
    acuarela: "Watercolor",
    punteado: "Dotted",
    petalos: "Petals",
    ramitas: "Twigs",
    enredadera: "Vines",
  } satisfies Record<BackgroundId, string>,
  secondary: {
    acento: { label: "From accent", hint: "Changes with your color" },
    oliva: { label: "Olive", hint: "The original green" },
    tinta: { label: "Ink", hint: "Almost black, elegant" },
    estilo: { label: "From style", hint: "The one the style brings" },
  } satisfies Record<SecondaryId, { label: string; hint: string }>,
  heroes: {
    split: { label: "Photo on the side", hint: "Text on the left, big photo on the right" },
    cover: { label: "Background photo", hint: "Your photo fills the whole cover" },
    centered: { label: "Centered", hint: "Circle photo and everything centered" },
    magazine: { label: "Magazine", hint: "Your name huge, like a magazine cover" },
  } satisfies Record<HeroId, { label: string; hint: string }>,
  sections: {
    contenido: "Content (Feed)",
    colaboraciones: "Collaborations",
    marcas: "Brands",
    resenas: "Reviews",
    servicios: "Services",
    paquetes: "Packages",
    testimonios: "Testimonials",
    why: "Why me",
    faq: "FAQ",
  } satisfies Record<SectionId, string>,
};
