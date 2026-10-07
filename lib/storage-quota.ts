import { effectivePlanId } from "./ambassadors";

// Cuota de piezas propias (foto/video subidos a Vercel Blob) por plan — ver docs/finops/auditoria-foliocrew.md,
// hallazgo P1-4: antes cualquier cuenta podía subir contenido sin tope, en un store de Blob compartido por
// toda la plataforma. Un post enlazado (TikTok/Instagram/Facebook) no cuenta: no ocupa nuestro almacenamiento.
//
// Los números por defecto son generosos para el uso real de un portafolio UGC (ver docs/finops/modelo-costos.md,
// perfiles de uso) y a la vez acotan el peor caso de almacenamiento por cuenta. Se pueden ajustar sin tocar
// código con STORAGE_MAX_PIECES_FOLIO / _PRO / _CREW en Vercel, igual que el tope mensual de IA (lib/ai.ts).
const DEFAULT_MEDIA_LIMITS: Record<string, number> = { folio: 40, pro: 150, crew: 400 };

export function mediaPieceLimit(plan: string, comp = false, ambassador = false) {
  const effective = effectivePlanId(plan, ambassador);
  const key = comp ? "crew" : effective in DEFAULT_MEDIA_LIMITS ? effective : "pro";
  const fromEnv = Number(process.env[`STORAGE_MAX_PIECES_${key.toUpperCase()}`]);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_MEDIA_LIMITS[key];
}

/** Se alcanzó el tope de fotos/videos propios del plan. */
export class StorageQuotaError extends Error {
  constructor(public limit: number) {
    super(`Llegaste al límite de ${limit} fotos/videos propios de tu plan. Puedes borrar alguno o enlazar el post en vez de subir el archivo.`);
  }
}

/** Uso actual de piezas propias de la cuenta y su tope. */
export async function mediaQuota() {
  const [{ prismaRoot }, { currentCreatorId }] = await Promise.all([import("@/lib/prisma-root"), import("@/lib/tenant")]);
  const creatorId = await currentCreatorId();
  const [creator, used] = await Promise.all([
    prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { plan: true, comp: true, ambassador: true } }),
    prismaRoot.contentCard.count({ where: { creatorId, OR: [{ photoUrl: { not: null } }, { videoUrl: { not: null } }] } }),
  ]);
  return { used, limit: mediaPieceLimit(creator?.plan ?? "pro", creator?.comp ?? false, creator?.ambassador ?? false) };
}

/** Lanza StorageQuotaError si la cuenta ya tiene todas sus piezas propias del plan ocupadas. */
export async function assertMediaQuota() {
  const { used, limit } = await mediaQuota();
  if (used >= limit) throw new StorageQuotaError(limit);
}

/** Mensaje de error legible para el panel, en el idioma de quien lo pide. */
export function storageQuotaErrorMessage(error: StorageQuotaError, lang: "es" | "en" = "es") {
  if (lang === "en") return `You reached your plan's limit of ${error.limit} uploaded photos/videos. Delete one or link the post instead of uploading the file.`;
  return error.message;
}
