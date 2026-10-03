// Paletas de acento elegibles en Apariencia. Cada una tiene 3 tonos:
// acento (botones, enlaces), oscuro (hover, textos destacados) y claro (etiquetas, fondos suaves).
// Todas tienen contraste de texto blanco sobre el acento ≥ 3.9:1 (igual o mejor que la paleta original).
// Además se puede elegir un color propio ("custom"): los otros dos tonos se calculan solos.

// "ring" son los 2 tonos exactos del handoff del link en bio (anillo del avatar). "light" y "dark" usan los
// mismos hex del handoff; "accent" es el tono de los botones con texto blanco (contraste ≥ 3.5:1), por eso en
// Terracota, Salvia y Dorado es un poco más oscuro que el segundo tono del anillo.
export const ACCENTS = {
  lila: { label: "Lila", accent: "#A866BE", dark: "#801F82", light: "#C3ACEA", ring: ["#C3ACEA", "#A866BE"] },
  rosa: { label: "Rosa", accent: "#D6336C", dark: "#9C2963", light: "#F3B4D0", ring: ["#F3B4D0", "#D6336C"] },
  terracota: { label: "Terracota", accent: "#C4613F", dark: "#B5533C", light: "#F0C3A0", ring: ["#F0C3A0", "#D9794F"] },
  salvia: { label: "Salvia", accent: "#5A8A5E", dark: "#3F6B4A", light: "#BFE0B0", ring: ["#BFE0B0", "#6E9B6E"] },
  azul: { label: "Azul", accent: "#3B6FD1", dark: "#1F4E8C", light: "#BFD9F7", ring: ["#BFD9F7", "#3B6FD1"] },
  dorado: { label: "Dorado", accent: "#A9741C", dark: "#8A6A1E", light: "#E8CE8D", ring: ["#E8CE8D", "#C9A227"] },
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
  const light = toHex(mix(rgb, [255, 255, 255], 0.6));
  return {
    accent,
    dark: toHex(mix(rgb, [0, 0, 0], 0.35)),
    light,
    ring: [light, hex.toUpperCase()] as const,
    adjusted: accent !== hex.toUpperCase(),
  };
}

function channels(hex: string) {
  return toRgb(hex).join(" ");
}

/** Mezcla un color hacia negro (t > 0) o blanco (t < 0). */
export function shade(hex: string, t: number) {
  return toHex(mix(toRgb(hex), t >= 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(t)));
}

/** Los 3 tonos del acento elegido (preset o color propio). */
export function resolvePalette(id: string | null | undefined, custom?: string | null) {
  return id === "custom" && isHexColor(custom) ? paletteFromHex(custom) : ACCENTS[isAccentId(id) ? id : DEFAULT_ACCENT];
}

/** Variables CSS que usan los colores coral / moss / lime de Tailwind. */
export function accentVars(id: string | null | undefined, custom?: string | null): Record<string, string> {
  const palette = resolvePalette(id, custom);
  return {
    "--accent": channels(palette.accent),
    "--accent-dark": channels(palette.dark),
    "--accent-light": channels(palette.light),
    "--ring-from": channels(palette.ring[0]),
    "--ring-to": channels(palette.ring[1]),
  };
}
