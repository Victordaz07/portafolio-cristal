// Reglas del planificador de contenido (Calendario / Crear). Sin dependencias de servidor.

export const CONTENT_TYPES = ["post", "carousel", "reel", "long_video", "story"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  post: "Post / Foto",
  carousel: "Carrusel",
  reel: "Reel / Video corto",
  long_video: "Video largo",
  story: "Historia",
};

export const PLAN_NETWORKS = ["instagram", "tiktok", "youtube", "facebook"] as const;
export type PlanNetwork = (typeof PLAN_NETWORKS)[number];

export const NETWORK_META: Record<
  PlanNetwork,
  { label: string; initials: string; badge: string; dot: string; captionLimit: number; previewChars: number }
> = {
  // Límites de texto vigentes de cada red (caption / descripción).
  instagram: { label: "Instagram", initials: "IG", badge: "bg-coral text-white", dot: "bg-coral", captionLimit: 2200, previewChars: 125 },
  tiktok: { label: "TikTok", initials: "TK", badge: "bg-ink text-white", dot: "bg-ink", captionLimit: 2200, previewChars: 100 },
  youtube: { label: "YouTube", initials: "YT", badge: "bg-cobalt text-white", dot: "bg-cobalt", captionLimit: 5000, previewChars: 100 },
  facebook: { label: "Facebook", initials: "FB", badge: "bg-moss text-white", dot: "bg-moss", captionLimit: 63206, previewChars: 180 },
};

export function isPlanNetwork(value: string): value is PlanNetwork {
  return (PLAN_NETWORKS as readonly string[]).includes(value);
}

export const POST_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  published: "Publicada",
};

/** Proporción de la vista previa según la red y el tipo de contenido. */
export function previewAspect(network: PlanNetwork, type: ContentType) {
  if (type === "story" || type === "reel") return "9 / 16";
  if (type === "long_video") return network === "youtube" || network === "facebook" ? "16 / 9" : "9 / 16";
  if (network === "tiktok") return "9 / 16";
  return "4 / 5";
}

/** Avisos antes de programar: límites de texto, hashtags y combinaciones que la red no admite. */
export function planWarnings(caption: string, type: ContentType, networks: PlanNetwork[]) {
  const warnings: string[] = [];
  const hashtags = caption.match(/#[\w\u00C0-\u024F]+/g)?.length ?? 0;
  for (const network of networks) {
    const meta = NETWORK_META[network];
    if (caption.length > meta.captionLimit) {
      warnings.push(`${meta.label}: el texto tiene ${caption.length} caracteres y el máximo es ${meta.captionLimit}.`);
    }
  }
  if (networks.includes("instagram") && hashtags > 30) {
    warnings.push(`Instagram: máximo 30 hashtags (tienes ${hashtags}).`);
  }
  if (networks.includes("youtube")) {
    const firstLine = caption.split("\n")[0] ?? "";
    if (firstLine.length > 100) {
      warnings.push("YouTube: la primera línea se usa como título y debe tener máximo 100 caracteres.");
    }
    if (type === "story" || type === "carousel" || type === "post") {
      warnings.push(`YouTube no admite "${CONTENT_TYPE_LABEL[type]}": solo videos y Shorts.`);
    }
  }
  if (networks.includes("tiktok") && type === "long_video") {
    warnings.push("TikTok: los videos largos funcionan, pero el formato vertical corto rinde mejor.");
  }
  if (networks.includes("tiktok") && type === "story") {
    warnings.push("TikTok: las historias no se pueden publicar por la API; súbela desde la app.");
  }
  return warnings;
}

// ─── Fecha y hora en la zona horaria de la app ───

/** Diferencia (ms) entre la hora local de `timeZone` y UTC en el instante `utcMs`. */
function zoneOffset(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - utcMs;
}

/** "2026-10-07" + "18:00" en `timeZone` → instante UTC. */
export function zonedToUtc(dateKey: string, time: string, timeZone: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  // Dos pasadas para acertar también en los cambios de horario de verano.
  let utc = naive - zoneOffset(naive, timeZone);
  utc = naive - zoneOffset(utc, timeZone);
  return new Date(utc);
}

/** Instante → { dateKey: "YYYY-MM-DD", time: "HH:MM" } en `timeZone`. */
export function utcToZoned(date: Date | string, timeZone: string) {
  const instant = typeof date === "string" ? new Date(date) : date;
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instant);
  return { dateKey, time };
}

/** "18:00" → "6:00 p. m." */
export function formatTime(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  const suffix = hh < 12 ? "a. m." : "p. m.";
  return `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, "0")} ${suffix}`;
}
