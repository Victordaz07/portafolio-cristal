import { prisma } from "@/lib/prisma";
import { prismaRoot } from "@/lib/prisma-root";
import { runAsCreator } from "@/lib/tenant";
import { PROVIDERS } from "./providers";
import { getFreshTokens } from "./accounts";
import { ensurePermanentThumbnail, isEphemeralCdnUrl } from "./thumbnail";
import type { PlatformId, RecentItem } from "./types";

/**
 * Clave para reconocer el mismo post en el Feed y en la API de la red:
 * Instagram por su código (/p/CODE, /reel/CODE), TikTok por el número de video,
 * YouTube por el id del video.
 */
export function postKey(platform: string, url: string | null | undefined) {
  if (!url) return null;
  if (platform === "instagram") return url.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([^/?#]+)/)?.[1] ?? null;
  if (platform === "tiktok") return url.match(/\/(?:video|photo)\/(\d+)/)?.[1] ?? null;
  if (platform === "facebook") return url.match(/\/(?:posts|videos|photos|watch)\/(\d+)/)?.[1] ?? url.match(/story_fbid=(\d+)/)?.[1] ?? null;
  if (platform === "youtube") return url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1] ?? null;
  return null;
}

// Redes del Feed cuyas APIs devuelven métricas y/o miniatura por publicación.
const SYNCABLE: PlatformId[] = ["instagram", "tiktok", "facebook"];

export interface SyncResult {
  platform: PlatformId;
  matched: number;
  checked: number;
  error?: string;
}

/** Busca las publicaciones recientes de cada red conectada y copia sus métricas a las tarjetas del Feed. */
export async function syncFeedMetrics(): Promise<{ results: SyncResult[]; updated: number }> {
  const [cards, accounts] = await Promise.all([
    prisma.contentCard.findMany({
      where: { postUrl: { not: null } },
      select: { id: true, platform: true, postUrl: true, thumbnailUrl: true },
    }),
    prisma.socialAccount.findMany({ where: { platform: { in: SYNCABLE } } }),
  ]);

  const results: SyncResult[] = [];
  let updated = 0;
  for (const account of accounts) {
    const platform = account.platform as PlatformId;
    const platformCards = cards.filter((c) => c.platform === platform);
    if (platformCards.length === 0) continue;
    try {
      const { tokens } = await getFreshTokens(account);
      const items: RecentItem[] = await PROVIDERS[platform].fetchRecent(tokens, 50);
      const byKey = new Map<string, RecentItem>();
      for (const item of items) {
        const key = postKey(platform, item.url) ?? (platform === "tiktok" ? item.id : null);
        if (key) byKey.set(key, item);
      }
      let matched = 0;
      for (const card of platformCards) {
        const key = postKey(platform, card.postUrl);
        const item = key ? byKey.get(key) : undefined;
        if (!item) continue;
        matched += 1;
        // Solo se pisan las métricas que la red devuelve; las demás (p. ej. vistas de Instagram) se respetan.
        const { views, likes, comments, shares } = item.stats;
        // Instagram y Facebook: si no hay miniatura o la que hay es un link temporal de Meta, se renueva y se resube a Blob.
        const needsThumbnail =
          (platform === "instagram" || platform === "facebook") &&
          item.thumbnailUrl &&
          (!card.thumbnailUrl || isEphemeralCdnUrl(card.thumbnailUrl));
        const thumbnailUrl = needsThumbnail
          ? await ensurePermanentThumbnail(item.thumbnailUrl, `content-cards/thumbnails/${platform}`)
          : null;
        await prisma.contentCard.update({
          where: { id: card.id },
          data: {
            ...(views != null && { views }),
            ...(likes != null && { likes }),
            ...(comments != null && { comments }),
            ...(shares != null && { shares }),
            ...(item.publishedAt && { postedAt: new Date(item.publishedAt) }),
            ...(thumbnailUrl && { thumbnailUrl }),
            metricsSyncedAt: new Date(),
          },
        });
      }
      updated += matched;
      results.push({ platform, matched, checked: platformCards.length });
    } catch (error) {
      results.push({
        platform,
        matched: 0,
        checked: platformCards.length,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
  return { results, updated };
}

/**
 * Miniatura de un post de Instagram/Facebook usando la cuenta conectada (API oficial de Meta):
 * mucho más confiable que raspar la página pública del post (lib/social/thumbnail.ts), que
 * Instagram bloquea cada vez más. Null si no hay cuenta conectada o no se encuentra el post
 * entre sus publicaciones recientes (p. ej. uno muy viejo).
 */
export async function resolveThumbnailViaAccount(
  platform: "instagram" | "facebook",
  postUrl: string
): Promise<string | null> {
  const account = await prisma.socialAccount.findFirst({ where: { platform } });
  if (!account) return null;
  const key = postKey(platform, postUrl);
  if (!key) return null;
  try {
    const { tokens } = await getFreshTokens(account);
    const items = await PROVIDERS[platform].fetchRecent(tokens, 50);
    const match = items.find((item) => postKey(platform, item.url) === key);
    if (!match?.thumbnailUrl) return null;
    return ensurePermanentThumbnail(match.thumbnailUrl, `content-cards/thumbnails/${platform}`);
  } catch {
    return null;
  }
}

/**
 * Corre `syncFeedMetrics` para cada cuenta activa (tarea diaria, ver app/api/cron/insights
 * y vercel.json): así las miniaturas de Instagram/Facebook se renuevan solas, sin que nadie tenga
 * que entrar al panel ni tocar "↻ Sincronizar métricas".
 */
export async function syncFeedThumbnailsForAllCreators() {
  const creators = await prismaRoot.creator.findMany({ where: { status: "active" }, select: { id: true } });
  let updated = 0;
  const errors: string[] = [];
  for (const creator of creators) {
    try {
      const result = await runAsCreator(creator.id, () => syncFeedMetrics());
      updated += result.updated;
    } catch (error) {
      errors.push(`${creator.id}: ${error instanceof Error ? error.message : "Error desconocido"}`);
    }
  }
  return { creators: creators.length, updated, errors };
}
