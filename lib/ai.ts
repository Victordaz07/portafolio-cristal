import Anthropic from "@anthropic-ai/sdk";

// Modelo de Claude para las funciones de IA del panel (captions, sugerencias).
export const AI_MODEL = "claude-opus-5-5";

export function isAiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;

export function getAiClient() {
  client ??= new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
  return client;
}

/** Contexto de la creadora para las sugerencias: nicho y captions recientes del Feed. */
export async function getCreatorContext() {
  const { prisma } = await import("@/lib/prisma");
  const [hero, cards] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, niche: true } }),
    prisma.contentCard.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { caption: true, category: true } }),
  ]);
  const recent = cards.map((c) => `- ${c.caption} (${c.category})`).join("\n");
  return [
    `Creador(a) de contenido: ${hero?.name ?? "creador(a) UGC"}.`,
    `Nicho: ${hero?.niche ?? "UGC de belleza y estilo de vida"}.`,
    recent ? `Publicaciones recientes de su portafolio:\n${recent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Mensaje de error legible para el panel a partir de un error de la API de Claude. */
export function aiErrorMessage(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) return "La ANTHROPIC_API_KEY no es válida";
  if (error instanceof Anthropic.PermissionDeniedError) return "La clave no tiene permiso para este modelo";
  if (error instanceof Anthropic.RateLimitError) return "Límite de uso alcanzado; intenta en un momento";
  if (error instanceof Anthropic.APIError) return `Error ${error.status}: ${error.message}`;
  return error instanceof Error ? error.message : "Error desconocido";
}
