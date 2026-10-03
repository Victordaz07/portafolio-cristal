// Paletas de acento elegibles en Apariencia. Cada una tiene 3 tonos:
// acento (botones, enlaces), oscuro (hover, textos destacados) y claro (etiquetas, fondos suaves).
// Todas tienen contraste de texto blanco sobre el acento ≥ 3.9:1 (igual o mejor que la paleta original).

export const ACCENTS = {
  lila: { label: "Lila", accent: "#A866BE", dark: "#801F82", light: "#C3ACEA" },
  rosa: { label: "Rosa", accent: "#C2507F", dark: "#8E2453", light: "#F2B8CF" },
  terracota: { label: "Terracota", accent: "#C4613F", dark: "#8F3A1F", light: "#F4C4B0" },
  salvia: { label: "Salvia", accent: "#5A8A5E", dark: "#33553A", light: "#C3DCC2" },
  azul: { label: "Azul", accent: "#4A74B8", dark: "#254A86", light: "#BFD0EF" },
  dorado: { label: "Dorado", accent: "#A9741C", dark: "#6F4A0E", light: "#EED9A8" },
  menta: { label: "Menta", accent: "#358D6F", dark: "#11372A", light: "#A4CBBE" },
  vino: { label: "Vino", accent: "#CE5573", dark: "#891F3A", light: "#F1E0E4" },
  turquesa: { label: "Turquesa", accent: "#2E889E", dark: "#0F3843", light: "#A4CBD5" },
  ciruela: { label: "Ciruela", accent: "#B95BB9", dark: "#712871", light: "#E7DAE7" },
  oliva: { label: "Oliva", accent: "#7A8532", dark: "#2A2F0E", light: "#C2C79E" },
  grafito: { label: "Grafito", accent: "#72809D", dark: "#37445D", light: "#DBDDE1" },
  fucsia: { label: "Fucsia", accent: "#D24B93", dark: "#891A55", light: "#F0DBE6" },
  canela: { label: "Canela", accent: "#B46E3C", dark: "#5D3519", light: "#DECCBF" },
} as const;

export type AccentId = keyof typeof ACCENTS;
export const DEFAULT_ACCENT: AccentId = "lila";

export function isAccentId(value: string | null | undefined): value is AccentId {
  return !!value && value in ACCENTS;
}

function channels(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
}

/** Variables CSS que usan los colores coral / moss / lime de Tailwind. */
export function accentVars(id: string | null | undefined): Record<string, string> {
  const palette = ACCENTS[isAccentId(id) ? id : DEFAULT_ACCENT];
  return {
    "--accent": channels(palette.accent),
    "--accent-dark": channels(palette.dark),
    "--accent-light": channels(palette.light),
  };
}

// Combinaciones tipográficas elegibles en Apariencia. "editorial" es el estilo
// original (serif con cursiva); "moderna" cambia el titular y el énfasis
// cursivo a una sola sans-serif (Work Sans) cargada en app/layout.tsx.
export const FONT_PAIRINGS = {
  editorial: { label: "Editorial", sample: "Aa", description: "Serif elegante con cursiva de acento (estilo original)." },
  moderna: { label: "Moderna", sample: "Aa", description: "Sans-serif limpia y directa en titulares y énfasis." },
} as const;

export type FontPairingId = keyof typeof FONT_PAIRINGS;
export const DEFAULT_FONT_PAIRING: FontPairingId = "editorial";

export function isFontPairingId(value: string | null | undefined): value is FontPairingId {
  return !!value && value in FONT_PAIRINGS;
}

/** Variables CSS que redirigen el titular (--font-fraunces) y la cursiva de énfasis (--font-bodoni). */
export function fontVars(id: string | null | undefined): Record<string, string> {
  if (!isFontPairingId(id) || id === "editorial") return {};
  return {
    "--font-fraunces": "var(--font-work-sans)",
    "--font-bodoni": "var(--font-work-sans)",
  };
}

// Intensidad del patrón decorativo de fondo (app/layout.tsx), siempre con el
// mismo asset (public/images/pattern-bg.webp) para no depender de arte nuevo.
export const BACKGROUND_STYLES = {
  ninguno: { label: "Ninguno", opacity: 0, description: "Fondo liso, sin textura." },
  sutil: { label: "Sutil", opacity: 0.12, description: "Textura apenas visible." },
  clasico: { label: "Clásico", opacity: 0.25, description: "Textura original del sitio." },
  marcado: { label: "Marcado", opacity: 0.4, description: "Textura bien presente." },
} as const;

export type BackgroundStyleId = keyof typeof BACKGROUND_STYLES;
export const DEFAULT_BACKGROUND_STYLE: BackgroundStyleId = "clasico";

export function isBackgroundStyleId(value: string | null | undefined): value is BackgroundStyleId {
  return !!value && value in BACKGROUND_STYLES;
}
