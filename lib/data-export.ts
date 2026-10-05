import { prismaRoot } from "./prisma-root";

// Copia de los datos de una cuenta (centro de Datos y recuperación). Nunca incluye contraseñas,
// tokens de redes ni enlaces de acceso; las notas internas del equipo solo van si lo pide el equipo.

export const DATA_REQUEST_KINDS = [
  { id: "export", label: "Copia de mis datos", hint: "Te mandamos todo lo que guardamos de tu cuenta." },
  { id: "recover", label: "Recuperar algo que borré", hint: "Cuéntanos qué se perdió y más o menos cuándo." },
  { id: "delete", label: "Borrar mi cuenta y mis datos", hint: "Se borra todo para siempre. No se puede deshacer." },
] as const;

export type DataRequestKind = (typeof DATA_REQUEST_KINDS)[number]["id"];

export const isDataRequestKind = (value: unknown): value is DataRequestKind =>
  DATA_REQUEST_KINDS.some((k) => k.id === value);

export const dataRequestKindLabel = (id: string) => DATA_REQUEST_KINDS.find((k) => k.id === id)?.label ?? id;

export const DATA_REQUEST_STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: "En proceso", tone: "bg-lime/40 text-ink" },
  done: { label: "Resuelto", tone: "bg-sage/30 text-cobalt-ink" },
  rejected: { label: "No se pudo", tone: "bg-red-50 text-red-700" },
};

export async function exportCreatorData(creatorId: string, { forTeam = false } = {}) {
  const where = { creatorId };
  const creator = await prismaRoot.creator.findUnique({
    where: { id: creatorId },
    omit: forTeam ? undefined : { adminNote: true, billingReminder: true },
  });
  if (!creator) return null;

  const [
    users, hero, siteSettings, stats, contentCards, brands, brandEvents, reviews, services, testimonials,
    packages, faqItems, contactMessages, socialAccounts, goals, actionItems, logEntries, scheduledPosts,
    followerSnapshots, payments, bioLinks, bioLinkGroups, supportTickets, ideas, dataRequests,
  ] = await Promise.all([
    prismaRoot.adminUser.findMany({ where, select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true, lastLoginAt: true, createdAt: true } }),
    prismaRoot.hero.findUnique({ where }),
    prismaRoot.siteSettings.findUnique({ where }),
    prismaRoot.stat.findMany({ where }),
    prismaRoot.contentCard.findMany({ where }),
    prismaRoot.brand.findMany({ where }),
    prismaRoot.brandEvent.findMany({ where }),
    prismaRoot.review.findMany({ where }),
    prismaRoot.service.findMany({ where }),
    prismaRoot.testimonial.findMany({ where }),
    prismaRoot.package.findMany({ where }),
    prismaRoot.faqItem.findMany({ where }),
    prismaRoot.contactMessage.findMany({ where }),
    prismaRoot.socialAccount.findMany({ where, omit: { accessToken: true, refreshToken: true } }),
    prismaRoot.goal.findMany({ where }),
    prismaRoot.actionItem.findMany({ where }),
    prismaRoot.logEntry.findMany({ where }),
    prismaRoot.scheduledPost.findMany({ where }),
    prismaRoot.followerSnapshot.findMany({ where }),
    prismaRoot.payment.findMany({ where }),
    prismaRoot.bioLink.findMany({ where }),
    prismaRoot.bioLinkGroup.findMany({ where }),
    prismaRoot.supportTicket.findMany({
      where,
      include: { messages: { where: forTeam ? {} : { internal: false }, orderBy: { createdAt: "asc" } } },
    }),
    prismaRoot.idea.findMany({ where, omit: forTeam ? undefined : { internalNote: true } }),
    prismaRoot.dataRequest.findMany({ where }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    note: "Copia de tus datos en Foliocrew. Por seguridad no incluye contraseñas ni las llaves de acceso a tus redes.",
    creator,
    users,
    site: { hero, siteSettings, stats, services, testimonials, packages, faqItems, bioLinks, bioLinkGroups },
    content: { contentCards, scheduledPosts },
    brands: { brands, brandEvents, reviews },
    contactMessages,
    socialAccounts,
    growth: { goals, actionItems, logEntries, followerSnapshots },
    payments,
    support: { supportTickets, ideas, dataRequests },
  };
}

/** Nombre del archivo de la copia, p. ej. "foliocrew-cristal-2026-10-05.json". */
export const exportFileName = (slug: string) => `foliocrew-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
