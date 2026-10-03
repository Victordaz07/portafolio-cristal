// Paletas de acento elegibles en Apariencia. Cada una tiene 3 tonos:
// acento (botones, enlaces), oscuro (hover, textos destacados) y claro (etiquetas, fondos suaves).
// Todas tienen contraste de texto blanco sobre el acento ≥ 3.9:1 (igual o mejor que la paleta original).
// Además se puede elegir un color propio ("custom"): los otros dos tonos se calculan solos.

export const ACCENTS = {
  lila: { label: "Lila", accent: "#A866BE", dark: "#801F82", light: "#C3ACEA" },
  rosa: { label: "Rosa", accent: "#C2507F", dark: "#8E2453", light: "#F2B8CF" },
  terracota: { label: "Terracota", accent: "#C4613F", dark: "#8F3A1F", light: "#F4C4B0" },
  salvia: { label: "Salvia", accent: "#5A8A5E", dark: "#33553A", light: "#C3DCC2" },
  azul: { label: "Azul", accent: "#4A74B8", dark: "#254A86", light: "#BFD0EF" },
  dorado: { label: "Dorado", accent: "#A9741C", dark: "#6F4A0E", light: "#EED9A8" },
} as const;

export type AccentId = keyof typeof ACCENTS;
export const DEFAULT_ACCENT: AccentId = "lila";
/** Contraste mínimo de texto blanco sobre el acento (botones). */
export const MIN_ACCENT_CONTRAST = 3.5;

export function isAccentId(value: string | null | undefined): value is AccentId {
  return !!value && value in ACCENTS;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

type RGB = [number, number, number];
const toRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const toHex = (rgb: RGB) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB;

function luminance([r, g, b]: RGB) {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastWithWhite(hex: string) {
  return 1.05 / (luminance(toRgb(hex)) + 0.05);
}

/** Paleta completa a partir de un color propio: lo oscurece lo justo para que el texto blanco se lea. */
export function paletteFromHex(hex: string) {
  let rgb = toRgb(hex);
  let steps = 0;
  while (contrastWithWhite(toHex(rgb)) < MIN_ACCENT_CONTRAST && steps < 40) {
    rgb = mix(rgb, [0, 0, 0], 0.05);
    steps++;
  }
  const accent = toHex(rgb);
  return {
    accent,
    dark: toHex(mix(rgb, [0, 0, 0], 0.35)),
    light: toHex(mix(rgb, [255, 255, 255], 0.6)),
    adjusted: accent !== hex.toUpperCase(),
  };
}

function channels(hex: string) {
  return toRgb(hex).join(" ");
}

/** Variables CSS que usan los colores coral / moss / lime de Tailwind. */
export function accentVars(id: string | null | undefined, custom?: string | null): Record<string, string> {
  const palette = id === "custom" && isHexColor(custom) ? paletteFromHex(custom) : ACCENTS[isAccentId(id) ? id : DEFAULT_ACCENT];
  return {
    "--accent": channels(palette.accent),
    "--accent-dark": channels(palette.dark),
    "--accent-light": channels(palette.light),
  };
}
