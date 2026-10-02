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
