// Calculadora "¿Cuánto cobro?": sugiere un rango de precio para un trato con una marca.
// Función pura (sin base de datos) para poder probarla. Las referencias son de mercado 2026 y
// son un punto de partida: cada creador decide su precio.

export type RatePlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "ugc";

export const RATE_PLATFORMS: { id: RatePlatform; label: string; labelEn: string }[] = [
  { id: "instagram", label: "Instagram", labelEn: "Instagram" },
  { id: "tiktok", label: "TikTok", labelEn: "TikTok" },
  { id: "youtube", label: "YouTube", labelEn: "YouTube" },
  { id: "facebook", label: "Facebook", labelEn: "Facebook" },
  { id: "ugc", label: "UGC (sin publicar en tu cuenta)", labelEn: "UGC (not posted on your account)" },
];

/** Formatos por red: precio de referencia por cada 1,000 de audiencia (o precio fijo para UGC). */
export const RATE_FORMATS: Record<RatePlatform, { id: string; label: string; labelEn: string; per1k: number }[]> = {
  instagram: [
    { id: "reel", label: "Reel", labelEn: "Reel", per1k: 12 },
    { id: "carousel", label: "Carrusel", labelEn: "Carousel", per1k: 10 },
    { id: "post", label: "Post (foto)", labelEn: "Post (photo)", per1k: 8 },
    { id: "story", label: "Historia", labelEn: "Story", per1k: 4 },
  ],
  tiktok: [{ id: "video", label: "Video", labelEn: "Video", per1k: 22 }],
  youtube: [
    { id: "dedicated", label: "Video dedicado", labelEn: "Dedicated video", per1k: 75 },
    { id: "integration", label: "Mención dentro de un video", labelEn: "Integration in a video", per1k: 40 },
    { id: "short", label: "Short", labelEn: "Short", per1k: 15 },
  ],
  facebook: [
    { id: "reel", label: "Reel", labelEn: "Reel", per1k: 8 },
    { id: "post", label: "Post", labelEn: "Post", per1k: 5 },
  ],
  ugc: [
    { id: "video", label: "Video UGC", labelEn: "UGC video", per1k: 0 },
    { id: "photo", label: "Fotos UGC (set)", labelEn: "UGC photos (set)", per1k: 0 },
  ],
};

/** Precio base por pieza UGC (no depende de los seguidores). */
const UGC_BASE: Record<string, number> = { video: 175, photo: 120 };
/** Engagement de referencia por red cuando no hay datos del nicho (%). */
export const BENCHMARK_ER: Record<Exclude<RatePlatform, "ugc">, number> = { instagram: 3, tiktok: 5, youtube: 4, facebook: 1.5 };
/** Ninguna pieza publicada vale menos que esto (cuentas pequeñas también trabajan). */
export const MIN_PER_PIECE = 50;

export const USAGE_OPTIONS = [0, 30, 60, 90, 365] as const;
export const EXCLUSIVITY_OPTIONS = [0, 30, 60, 90] as const;

export interface RateInput {
  platform: RatePlatform;
  format: string;
  quantity: number;
  /** Seguidores de la cuenta en esa red. */
  followers: number | null;
  /** Vistas medianas de sus publicaciones en esa red (si hay). */
  medianViews?: number | null;
  /** Engagement mediano del creador en esa red (%). */
  creatorEr?: number | null;
  /** Engagement mediano del nicho (%), de la Inteligencia Foliocrew. */
  nicheEr?: number | null;
  /** Días que la marca puede usar el contenido en sus propios anuncios o redes. */
  usageDays: number;
  /** Días que no puedes trabajar con la competencia. */
  exclusivityDays: number;
  /** Spark Ads / whitelisting: la marca pauta desde tu cuenta. */
  whitelisting: boolean;
}

export interface RateStep {
  id: "base" | "engagement" | "bundle" | "usage" | "exclusivity" | "whitelisting";
  /** Multiplicador aplicado (1 = sin cambio). En "base" es 1 y el monto va en `amount`. */
  factor: number;
  amount?: number;
}

export interface RateResult {
  low: number;
  fair: number;
  high: number;
  perPiece: number;
  steps: RateStep[];
  /** Con qué audiencia se calculó (vistas o seguidores). */
  audience: number;
  audienceSource: "views" | "followers" | "none";
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Redondea a un número "de precio": de 5 en 5 hasta 1,000; de 10 en 10 después. */
export function roundPrice(n: number) {
  const step = n >= 1000 ? 10 : 5;
  return Math.max(step, Math.round(n / step) * step);
}

/** Multiplicador por derechos de uso: +25% por cada 30 días (365 días = +150%, el tope). */
export function usageFactor(days: number) {
  if (days <= 0) return 1;
  return 1 + Math.min(1.5, (days / 30) * 0.25);
}

/** Multiplicador por exclusividad: +10% por cada 30 días, hasta +30%. */
export function exclusivityFactor(days: number) {
  if (days <= 0) return 1;
  return 1 + Math.min(0.3, (days / 30) * 0.1);
}

/** Multiplicador por interacción: igual al nicho = ×1; el doble = ×1.5; tope ×2.5 y piso ×0.75. */
export function engagementFactor(creatorEr: number | null | undefined, referenceEr: number | null | undefined) {
  if (!creatorEr || !referenceEr) return 1;
  return Math.round(clamp(0.5 + 0.5 * (creatorEr / referenceEr), 0.75, 2.5) * 100) / 100;
}

/** Descuento por paquete: 3 o más piezas −5%, 5 o más −10%. */
export function bundleFactor(quantity: number) {
  return quantity >= 5 ? 0.9 : quantity >= 3 ? 0.95 : 1;
}

export function calculateRate(input: RateInput): RateResult {
  const quantity = clamp(Math.round(input.quantity) || 1, 1, 50);
  const formats = RATE_FORMATS[input.platform];
  const format = formats.find((f) => f.id === input.format) ?? formats[0];
  const steps: RateStep[] = [];

  let perPiece: number;
  let audience = 0;
  let audienceSource: RateResult["audienceSource"] = "none";
  if (input.platform === "ugc") {
    perPiece = UGC_BASE[format.id] ?? UGC_BASE.video;
    steps.push({ id: "base", factor: 1, amount: perPiece });
  } else {
    // En TikTok y YouTube importan más las vistas que los seguidores.
    const viewsFirst = input.platform === "tiktok" || input.platform === "youtube";
    if (viewsFirst && input.medianViews && input.medianViews > 0) {
      audience = input.medianViews;
      audienceSource = "views";
    } else if (input.followers && input.followers > 0) {
      audience = input.followers;
      audienceSource = "followers";
    }
    perPiece = Math.max(MIN_PER_PIECE, (audience / 1000) * format.per1k);
    steps.push({ id: "base", factor: 1, amount: Math.round(perPiece) });
    const er = engagementFactor(input.creatorEr, input.nicheEr ?? BENCHMARK_ER[input.platform]);
    if (er !== 1) steps.push({ id: "engagement", factor: er });
    perPiece *= er;
  }

  let total = perPiece * quantity;
  const bundle = bundleFactor(quantity);
  if (bundle !== 1) steps.push({ id: "bundle", factor: bundle });
  total *= bundle;
  for (const [id, factor] of [
    ["usage", usageFactor(input.usageDays)],
    ["exclusivity", exclusivityFactor(input.exclusivityDays)],
    ["whitelisting", input.whitelisting ? 1.3 : 1],
  ] as const) {
    if (factor !== 1) steps.push({ id, factor: Math.round(factor * 100) / 100 });
    total *= factor;
  }

  const fair = roundPrice(total);
  return {
    low: roundPrice(total * 0.8),
    fair,
    high: roundPrice(total * 1.3),
    perPiece: roundPrice(fair / quantity),
    steps,
    audience,
    audienceSource,
  };
}
