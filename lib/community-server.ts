import { prismaRoot } from "./prisma-root";
import { nicheOf } from "./platform-analytics";
import { creatorTypesFrom, featuredScore } from "./community";
import type { T } from "./admin-lang";

// Comunidad: lo que necesita el servidor. Los modelos de la comunidad son ENTRE cuentas, así que
// se usa prismaRoot y los permisos se validan aquí (nunca confiar en lo que manda el navegador).

type Session = { creatorId: string; userId: string; actorId: string | null };

/** Perfil de comunidad de la cuenta; si no existe, se arma con los datos que ya tiene en Foliocrew. */
export async function ensureProfile(creatorId: string) {
  const existing = await prismaRoot.communityProfile.findUnique({ where: { creatorId } });
  if (existing) return existing;
  const creator = await prismaRoot.creator.findUnique({
    where: { id: creatorId },
    select: {
      name: true,
      creatorKind: true,
      hero: { select: { name: true, photoUrl: true, location: true, niche: true } },
      socialAccounts: { select: { platform: true } },
      users: { where: { role: "owner" }, take: 1, select: { language: true } },
    },
  });
  if (!creator) throw new Error("Cuenta no encontrada");
  const niche = creator.hero?.niche ? nicheOf(creator.hero.niche).id : null;
  const language = creator.users[0]?.language === "en" ? "en" : "es";
  return prismaRoot.communityProfile
    .create({
      data: {
        creatorId,
        displayName: creator.hero?.name?.trim() || creator.name,
        avatarUrl: creator.hero?.photoUrl || null,
        city: creator.hero?.location?.trim() || null,
        niche,
        creatorTypes: creatorTypesFrom(
          creator.socialAccounts.map((s) => s.platform),
          creator.creatorKind
        ),
        languages: language === "en" ? ["en", "es"] : ["es"],
      },
    })
    .catch(async (error) => {
      // Dos pestañas a la vez: si el otro pedido ya lo creó, usamos ese.
      const again = await prismaRoot.communityProfile.findUnique({ where: { creatorId } });
      if (again) return again;
      throw error;
    });
}

/**
 * ¿Puede publicar, responder o reaccionar? Devuelve el motivo exacto si no.
 * (Leer sí se puede siempre que haya sesión, incluso "entrando como" para dar soporte.)
 */
export async function participation(session: Session, t: T): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  if (session.actorId) {
    return { ok: false, error: t("El equipo no puede publicar en nombre de una cuenta", "The team can't post on behalf of an account") };
  }
  const [user, profile] = await Promise.all([
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } }),
    prismaRoot.communityProfile.findUnique({ where: { creatorId: session.creatorId }, select: { id: true, acceptedRulesAt: true, mutedUntil: true } }),
  ]);
  if (!user?.emailVerifiedAt) return { ok: false, error: t("Confirma tu correo para participar", "Confirm your email to participate") };
  if (!profile?.acceptedRulesAt) return { ok: false, error: t("Acepta las reglas de la comunidad", "Accept the community rules") };
  if (profile.mutedUntil && profile.mutedUntil > new Date()) {
    return { ok: false, error: t("Tu participación está pausada por el equipo de Comunidad", "Your participation is paused by the Community team") };
  }
  return { ok: true, profileId: profile.id };
}

/** Cuentas que bloqueé o que me bloquearon (no nos vemos mutuamente). */
export async function blockedIds(creatorId: string) {
  const rows = await prismaRoot.communityBlock.findMany({
    where: { OR: [{ blockerId: creatorId }, { blockedId: creatorId }] },
    select: { blockerId: true, blockedId: true },
  });
  return Array.from(new Set(rows.map((r) => (r.blockerId === creatorId ? r.blockedId : r.blockerId))));
}

/** Perfil de otra persona por su @handle (el slug de la cuenta). */
export async function profileByHandle(handle: string) {
  const creator = await prismaRoot.creator.findUnique({
    where: { slug: handle.toLowerCase() },
    select: { id: true, slug: true, status: true, customDomain: true, customDomainVerifiedAt: true },
  });
  if (!creator || creator.status !== "active") return null;
  const profile = await prismaRoot.communityProfile.findUnique({ where: { creatorId: creator.id } });
  if (!profile?.acceptedRulesAt) return null;
  return { creator, profile };
}

// ─── Muro ───

export const postAuthorSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  reputation: true,
  creator: { select: { slug: true } },
} as const;

export type FeedFilters = { tab: "recientes" | "destacadas"; kind?: string; topic?: string; type?: string; take: number };

/** Publicaciones del muro: sin ocultas, borradas ni de cuentas bloqueadas (en ambos sentidos). */
export async function feedPosts(viewerId: string, f: FeedFilters) {
  const blocked = await blockedIds(viewerId);
  const where = {
    hiddenAt: null,
    deletedAt: null,
    pinned: false,
    creator: { status: "active" },
    ...(blocked.length ? { creatorId: { notIn: blocked } } : {}),
    ...(f.kind ? { kind: f.kind } : {}),
    ...(f.topic ? { topic: f.topic } : {}),
    ...(f.type ? { OR: [{ creatorTypes: { has: f.type } }, { profile: { creatorTypes: { has: f.type } } }] } : {}),
  };
  const select = {
    id: true,
    kind: true,
    topic: true,
    title: true,
    body: true,
    titleEn: true,
    bodyEn: true,
    imageUrl: true,
    creatorTypes: true,
    helpfulCount: true,
    replyCount: true,
    bestReplyId: true,
    pinned: true,
    fromTeam: true,
    createdAt: true,
    lastActivityAt: true,
    creatorId: true,
    profile: { select: postAuthorSelect },
  } as const;

  const [pinned, rows] = await Promise.all([
    prismaRoot.communityPost.findMany({ where: { pinned: true, hiddenAt: null, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 2, select }),
    f.tab === "destacadas"
      ? // Destacadas: se ordena por puntaje entre las de los últimos 30 días.
        prismaRoot.communityPost.findMany({
          where: { ...where, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
          orderBy: { createdAt: "desc" },
          take: 300,
          select,
        })
      : prismaRoot.communityPost.findMany({ where, orderBy: { createdAt: "desc" }, take: f.take + 1, select }),
  ]);
  const sorted = f.tab === "destacadas" ? [...rows].sort((a, b) => featuredScore(b) - featuredScore(a)) : rows;
  return { pinned, posts: sorted.slice(0, f.take), hasMore: sorted.length > f.take };
}

export type FeedPost = Awaited<ReturnType<typeof feedPosts>>["posts"][number];
