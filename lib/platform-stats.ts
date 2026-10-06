import { prismaRoot } from "./prisma-root";

// Datos del panel de dueño: todas las cuentas de Foliocrew (sin filtro por creadora).

export function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function platformAccounts() {
  const monthStart = startOfMonth();
  const [creators, aiThisMonth] = await Promise.all([
    prismaRoot.creator.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        customDomain: true,
        customDomainVerifiedAt: true,
        onboardedAt: true,
        adminNote: true,
        plan: true,
        comp: true,
        ambassador: true,
        trialEndsAt: true,
        paidUntil: true,
        createdAt: true,
        users: {
          where: { role: "owner" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { email: true, emailVerifiedAt: true, lastLoginAt: true },
        },
        socialAccounts: { select: { platform: true } },
        _count: { select: { contentCards: true, brands: true, contactMessages: true } },
      },
    }),
    prismaRoot.aiUsage.groupBy({ by: ["creatorId"], where: { createdAt: { gte: monthStart } }, _count: { _all: true } }),
  ]);
  const ai = new Map(aiThisMonth.map((row) => [row.creatorId, row._count._all]));
  return creators.map((c) => ({
    ...c,
    owner: c.users[0] ?? null,
    networks: c.socialAccounts.map((a) => a.platform),
    aiThisMonth: ai.get(c.id) ?? 0,
  }));
}

export type PlatformAccount = Awaited<ReturnType<typeof platformAccounts>>[number];
