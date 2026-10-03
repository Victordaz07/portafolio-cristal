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
  const [{ prismaRoot }, { currentCreatorId }, { insightForNiche, insightPromptText }] = await Promise.all([
    import("@/lib/prisma-root"),
    import("@/lib/tenant"),
    import("@/lib/insights"),
  ]);
  const [hero, cards, creator] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, niche: true } }),
    prisma.contentCard.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { caption: true, category: true } }),
    prismaRoot.creator.findUnique({ where: { id: await currentCreatorId() }, select: { shareInsights: true, creatorKind: true } }),
  ]);
  // Quien participa en la inteligencia de Foliocrew recibe sugerencias basadas en resultados reales de su nicho.
  const insight = creator?.shareInsights ? await insightForNiche(hero?.niche).catch(() => null) : null;
  const recent = cards.map((c) => `- ${c.caption} (${c.category})`).join("\n");
  const { kindInfo } = await import("@/lib/creator-kind");
  const kind = kindInfo(creator?.creatorKind);
  return [
    `Persona: ${hero?.name ?? "sin nombre"}, ${kind.role}.`,
    kind.id === "ugc"
      ? "Crea contenido para que las marcas lo publiquen en sus propias redes y anuncios."
      : kind.id === "ambos"
        ? "Publica en sus propias redes para su comunidad y también crea contenido UGC para que las marcas lo publiquen."
        : "Publica en sus propias redes para su comunidad; las marcas le pagan por mostrar sus productos a esa audiencia.",
    `Nicho: ${hero?.niche ?? "estilo de vida"}.`,
    recent ? `Publicaciones recientes de su portafolio:\n${recent}` : "",
    insight ? `${insightPromptText(insight)}\nUsa estos datos para orientar tus sugerencias (sin citarlos textualmente).` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Guarda una sugerencia de IA pedida por la cuenta actual (panel de dueño y límites por plan). */
export async function recordAiUsage(kind: "caption" | "tips" | "design", usage?: { input_tokens?: number; output_tokens?: number }) {
  try {
    const [{ prismaRoot }, { currentCreatorId }] = await Promise.all([import("@/lib/prisma-root"), import("@/lib/tenant")]);
    await prismaRoot.aiUsage.create({
      data: {
        creatorId: await currentCreatorId(),
        kind,
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar el uso de IA", error);
  }
}

/** Mensaje de error legible para el panel a partir de un error de la API de Claude. */
export function aiErrorMessage(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) return "La ANTHROPIC_API_KEY no es válida";
  if (error instanceof Anthropic.PermissionDeniedError) return "La clave no tiene permiso para este modelo";
  if (error instanceof Anthropic.RateLimitError) return "Límite de uso alcanzado; intenta en un momento";
  if (error instanceof Anthropic.APIError) return `Error ${error.status}: ${error.message}`;
  return error instanceof Error ? error.message : "Error desconocido";
}
