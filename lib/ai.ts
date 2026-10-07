import Anthropic from "@anthropic-ai/sdk";
import { effectivePlanId } from "./ambassadors";

// Modelo de Claude para las funciones de IA del panel (captions, sugerencias, diseño, playbooks).
// Sonnet 5.5 cuesta la mitad que Opus 5.5 y sobra para textos cortos. Para cambiarlo sin tocar
// código: variable AI_MODEL en Vercel (por ejemplo "claude-opus-5-5").
export const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-5-5";

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

/** Se alcanzó el tope de sugerencias de IA del mes (por plan). */
export class AiQuotaError extends Error {
  constructor(public limit: number) {
    super(`Llegaste al límite de ${limit} sugerencias de IA de este mes. Se renueva el día 1.`);
  }
}

export class AiRateError extends Error {
  constructor() {
    super("Demasiadas sugerencias seguidas. Espera un rato e inténtalo de nuevo.");
  }
}

/** La IA se negó a responder (filtro de seguridad). */
export class AiRefusalError extends Error {
  constructor() {
    super("La IA no pudo generar esta sugerencia");
  }
}

// Sugerencias de IA por mes según el plan (cada caption, consejo o diseño cuenta 1). Se pueden
// cambiar sin tocar código con AI_MONTHLY_LIMIT_FOLIO / _PRO / _CREW en Vercel.
const DEFAULT_AI_LIMITS: Record<string, number> = { folio: 60, pro: 300, crew: 1000 };

export function aiMonthlyLimit(plan: string, comp = false, ambassador = false) {
  const effective = effectivePlanId(plan, ambassador);
  const key = comp ? "crew" : effective in DEFAULT_AI_LIMITS ? effective : "pro";
  const fromEnv = Number(process.env[`AI_MONTHLY_LIMIT_${key.toUpperCase()}`]);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_AI_LIMITS[key];
}

/** Uso de IA del mes de la cuenta actual y su tope. */
export async function aiQuota() {
  const [{ prismaRoot }, { currentCreatorId }] = await Promise.all([import("@/lib/prisma-root"), import("@/lib/tenant")]);
  const creatorId = await currentCreatorId();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [creator, used] = await Promise.all([
    prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { plan: true, comp: true, ambassador: true } }),
    prismaRoot.aiUsage.count({ where: { creatorId, createdAt: { gte: monthStart } } }),
  ]);
  return { used, limit: aiMonthlyLimit(creator?.plan ?? "pro", creator?.comp ?? false, creator?.ambassador ?? false), creatorId };
}

export type AiUsageKind = "caption" | "tips" | "design" | "pitch" | "test" | "recycle";

/**
 * Reserva un cupo de IA ANTES de llamar a Claude (gasto real) y devuelve el id de la fila de uso
 * para completarla o liberarla después. Antes, el tope mensual se verificaba con un simple
 * "contar y comparar" y recién se registraba el uso después de la respuesta: dos pedidos casi
 * simultáneos (varias pestañas, doble clic) podían leer el mismo conteo y pasar los dos, superando
 * el tope. Aquí el conteo y la reserva ocurren dentro de la misma transacción, con un advisory lock
 * de Postgres por creadora (`pg_advisory_xact_lock`), así que una segunda reserva concurrente de la
 * MISMA creadora espera a que la primera transacción termine y ya ve el conteo actualizado: el tope
 * queda duro incluso con varias instancias de servidor a la vez (no depende de memoria de proceso).
 *
 * Si la llamada a Claude falla, usa `releaseAiUsage` para liberar el cupo (no se cobra por errores).
 * Si tiene éxito, usa `commitAiUsage` para guardar los tokens reales.
 */
export async function reserveAiUsage(kind: AiUsageKind): Promise<string> {
  const [{ prismaRoot }, { currentCreatorId }, { tooManyAttempts }] = await Promise.all([
    import("@/lib/prisma-root"),
    import("@/lib/tenant"),
    import("@/lib/rate-limit"),
  ]);
  const creatorId = await currentCreatorId();
  // Freno de abuso en ráfaga (además del tope mensual): no más de 30 pedidos por hora.
  // Es en memoria de proceso (best-effort); el tope mensual de abajo es el límite duro real.
  if (tooManyAttempts(`ai:${creatorId}`, 30, 60 * 60_000)) throw new AiRateError();

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  return prismaRoot.$transaction(async (tx) => {
    // Serializa las reservas de ESTA creadora entre sí (no bloquea a otras creadoras).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('ai_usage'), hashtext(${creatorId}))`;
    const [creator, used] = await Promise.all([
      tx.creator.findUnique({ where: { id: creatorId }, select: { plan: true, comp: true, ambassador: true } }),
      tx.aiUsage.count({ where: { creatorId, createdAt: { gte: monthStart } } }),
    ]);
    const limit = aiMonthlyLimit(creator?.plan ?? "pro", creator?.comp ?? false, creator?.ambassador ?? false);
    if (used >= limit) throw new AiQuotaError(limit);
    const usage = await tx.aiUsage.create({ data: { creatorId, kind, inputTokens: 0, outputTokens: 0 } });
    return usage.id;
  });
}

/** Completa una reserva con los tokens reales, después de una llamada a Claude exitosa. */
export async function commitAiUsage(usageId: string, usage?: { input_tokens?: number; output_tokens?: number }) {
  try {
    const { prismaRoot } = await import("@/lib/prisma-root");
    await prismaRoot.aiUsage.update({
      where: { id: usageId },
      data: { inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0 },
    });
  } catch (error) {
    console.error("No se pudo completar el uso de IA", error);
  }
}

/** Libera una reserva sin usar (la llamada a Claude falló): no debe contar contra el tope mensual. */
export async function releaseAiUsage(usageId: string) {
  try {
    const { prismaRoot } = await import("@/lib/prisma-root");
    await prismaRoot.aiUsage.delete({ where: { id: usageId } });
  } catch (error) {
    console.error("No se pudo liberar la reserva de uso de IA", error);
  }
}

/** Mensaje de error legible para el panel a partir de un error de la API de Claude. */
export function aiErrorMessage(error: unknown, lang: "es" | "en" = "es") {
  const en = lang === "en";
  if (error instanceof AiQuotaError) {
    return en ? `You reached this month's limit of ${error.limit} AI suggestions. It resets on the 1st.` : error.message;
  }
  if (error instanceof Anthropic.AuthenticationError) return en ? "The ANTHROPIC_API_KEY isn't valid" : "La ANTHROPIC_API_KEY no es válida";
  if (error instanceof Anthropic.PermissionDeniedError) return en ? "The key doesn't have permission for this model" : "La clave no tiene permiso para este modelo";
  if (error instanceof Anthropic.RateLimitError) return en ? "Usage limit reached; try again in a moment" : "Límite de uso alcanzado; intenta en un momento";
  if (error instanceof Anthropic.APIError) return `Error ${error.status}: ${error.message}`;
  if (error instanceof AiRateError) return en ? "Too many suggestions in a row. Wait a bit and try again." : error.message;
  if (error instanceof AiRefusalError) return en ? "The AI couldn't generate this suggestion" : error.message;
  return error instanceof Error ? error.message : en ? "Unknown error" : "Error desconocido";
}
