import { prismaRoot } from "@/lib/prisma-root";
import { blockedIds } from "@/lib/community-server";
import { hasRole, teamUser } from "@/lib/team";
import { canAccess, sessionPhase, PAGE_SIZE } from "@/lib/circles";

// Círculos y sesiones (E7). Son ENTRE cuentas, así que se usa prismaRoot y los permisos se validan aquí.

/** Plan de la cuenta (para el beneficio Crew). */
export async function accountPlan(creatorId: string) {
  const c = await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { plan: true, comp: true, ambassador: true } });
  return { plan: c?.plan ?? "pro", comp: c?.comp ?? false };
}

/** ¿Es moderadora de este círculo (o del equipo de Comunidad)? */
export async function canModerateCircle(circleId: string, creatorId: string) {
  const [member, team] = await Promise.all([
    prismaRoot.circleMember.findUnique({ where: { circleId_creatorId: { circleId, creatorId } }, select: { role: true } }),
    teamUser(),
  ]);
  return member?.role === "moderator" || hasRole(team, "community");
}

/** Mensajes visibles del círculo (sin ocultos, salvo para moderación; sin cuentas bloqueadas en ningún sentido). */
export async function circleMessages(circleId: string, viewerId: string, moderator: boolean, take = PAGE_SIZE) {
  const blocked = await blockedIds(viewerId);
  const rows = await prismaRoot.circleMessage.findMany({
    where: { circleId, ...(moderator ? {} : { hiddenAt: null }), ...(blocked.length ? { creatorId: { notIn: blocked } } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, body: true, createdAt: true, hiddenAt: true, creatorId: true, creator: { select: { slug: true, communityProfile: { select: { displayName: true, avatarUrl: true } }, circleMemberships: { where: { circleId }, select: { role: true } } } } },
  });
  return rows.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    hidden: Boolean(m.hiddenAt),
    mine: m.creatorId === viewerId,
    handle: m.creator.slug,
    name: m.creator.communityProfile?.displayName ?? m.creator.slug,
    avatarUrl: m.creator.communityProfile?.avatarUrl ?? null,
    moderator: m.creator.circleMemberships[0]?.role === "moderator",
  }));
}

/** Estado de una sesión para una persona: fase, cupos y si ya reservó (el enlace solo se entrega si reservó). */
export async function sessionsFor(viewerId: string) {
  const [account, sessions, mine] = await Promise.all([
    accountPlan(viewerId),
    prismaRoot.liveSession.findMany({ where: { startsAt: { gte: new Date(Date.now() - 6 * 3_600_000) } }, orderBy: { startsAt: "asc" }, take: 30, include: { circle: { select: { name: true, nameEn: true, slug: true } }, _count: { select: { rsvps: true } } } }),
    prismaRoot.sessionRsvp.findMany({ where: { creatorId: viewerId }, select: { sessionId: true } }),
  ]);
  const reserved = new Set(mine.map((m) => m.sessionId));
  return sessions.map((s) => {
    const phase = sessionPhase(s);
    const has = reserved.has(s.id);
    return {
      id: s.id,
      kind: s.kind,
      title: s.title,
      titleEn: s.titleEn,
      description: s.description,
      descriptionEn: s.descriptionEn,
      hostName: s.hostName,
      startsAt: s.startsAt,
      durationMin: s.durationMin,
      crewOnly: s.crewOnly,
      allowed: canAccess(s.crewOnly, account),
      capacity: s.capacity,
      taken: s._count.rsvps,
      phase,
      reserved: has,
      joinUrl: has && phase !== "canceled" && phase !== "ended" ? s.joinUrl : null,
      circle: s.circle,
    };
  });
}
