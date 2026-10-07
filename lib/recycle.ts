// Reciclaje de contenido con IA (E4). Lógica pura (se prueba en tests/recycle.test.ts):
// limpia lo que se pega, y deja el resultado de la IA dentro de los límites reales de cada red.

export const SOURCE_MIN = 40;
export const SOURCE_MAX = 12_000;
export const RECYCLE_TONES = ["cercano", "profesional", "directo"] as const;
export type RecycleTone = (typeof RECYCLE_TONES)[number];

/** Texto de partida listo para la IA: sin espacios de más y recortado (nunca pasa de SOURCE_MAX). */
export function cleanSource(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, SOURCE_MAX);
}

export const isUsableSource = (text: string) => cleanSource(text).length >= SOURCE_MIN;

export interface RecycleRaw {
  hooks: string[];
  instagram: { caption: string; hashtags: string[] };
  tiktok: { caption: string; onScreenText: string };
  youtube: { title: string; description: string };
  facebook: { post: string };
  carousel: { slides: { title: string; text: string }[] };
}
export type RecycleResult = RecycleRaw;

const clip = (v: string, n: number) => v.trim().slice(0, n);
const tag = (v: string) => `#${v.replace(/^#+/, "").replace(/[\s#!?.,;:'"()[\]{}<>@$%^&*+=|\\/~`-]/g, "")}`;

/** Deja la respuesta de la IA dentro de los límites de cada red (y descarta lo vacío). */
export function shapeResult(raw: RecycleRaw): RecycleResult {
  const hashtags = Array.from(new Set(raw.instagram.hashtags.map(tag).filter((h) => h.length > 1))).slice(0, 5);
  return {
    hooks: raw.hooks.map((h) => clip(h, 140)).filter(Boolean).slice(0, 5),
    instagram: { caption: clip(raw.instagram.caption, 2000), hashtags },
    tiktok: { caption: clip(raw.tiktok.caption, 300), onScreenText: clip(raw.tiktok.onScreenText, 120) },
    youtube: { title: clip(raw.youtube.title, 100), description: clip(raw.youtube.description, 5000) },
    facebook: { post: clip(raw.facebook.post, 3000) },
    carousel: { slides: raw.carousel.slides.map((s) => ({ title: clip(s.title, 60), text: clip(s.text, 220) })).filter((s) => s.title || s.text).slice(0, 8) },
  };
}

export interface BankDraft {
  title: string;
  caption: string;
  contentType: "post" | "carousel" | "reel" | "long_video";
  networks: ("instagram" | "tiktok" | "youtube" | "facebook")[];
}

/** Las versiones que se pueden guardar en el banco de contenido (una por red), con el título en la primera línea. */
export function bankDrafts(result: RecycleResult): BankDraft[] {
  const out: BankDraft[] = [];
  const first = (text: string) => text.split("\n")[0].slice(0, 80) || "Idea reciclada";
  const ig = [result.instagram.caption, result.instagram.hashtags.join(" ")].filter(Boolean).join("\n\n");
  if (ig) out.push({ title: `IG · ${first(result.instagram.caption)}`, caption: ig, contentType: "reel", networks: ["instagram"] });
  if (result.tiktok.caption) out.push({ title: `TikTok · ${first(result.tiktok.caption)}`, caption: result.tiktok.caption, contentType: "reel", networks: ["tiktok"] });
  if (result.youtube.title) out.push({ title: `YouTube · ${result.youtube.title.slice(0, 80)}`, caption: `${result.youtube.title}\n\n${result.youtube.description}`.trim(), contentType: "long_video", networks: ["youtube"] });
  if (result.facebook.post) out.push({ title: `Facebook · ${first(result.facebook.post)}`, caption: result.facebook.post, contentType: "post", networks: ["facebook"] });
  if (result.carousel.slides.length) {
    out.push({
      title: `Carrusel · ${result.carousel.slides[0].title || "Idea reciclada"}`.slice(0, 120),
      caption: result.carousel.slides.map((s, i) => `${i + 1}. ${s.title}${s.text ? `: ${s.text}` : ""}`).join("\n"),
      contentType: "carousel",
      networks: ["instagram"],
    });
  }
  return out;
}
