import { prismaRoot } from "./prisma-root";

// Copia de los datos de una cuenta (centro de Datos y recuperación). Nunca incluye contraseñas,
// tokens de redes ni enlaces de acceso; las notas internas del equipo solo van si lo pide el equipo.

export { DATA_REQUEST_KINDS, DATA_REQUEST_STATUS, dataRequestKindLabel, isDataRequestKind, type DataRequestKind } from "./data-requests";

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
    followerSnapshots, payments, bioLinks, bioLinkGroups, supportTickets, ideas, dataRequests, incomeEntries, expenses, commentTriggers, brandReviews, contentBank, restPeriods, products, circleMemberships, circleMessages, sessionRsvps,
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
    prismaRoot.incomeEntry.findMany({ where }),
    prismaRoot.expense.findMany({ where }),
    prismaRoot.commentTrigger.findMany({ where }),
    prismaRoot.brandReview.findMany({ where: { reviewerId: creatorId } }),
    prismaRoot.contentBankItem.findMany({ where }),
    prismaRoot.restPeriod.findMany({ where }),
    prismaRoot.product.findMany({ where }),
    prismaRoot.circleMember.findMany({ where, include: { circle: { select: { slug: true, name: true } } } }),
    prismaRoot.circleMessage.findMany({ where, select: { id: true, circleId: true, body: true, hiddenAt: true, createdAt: true } }),
    prismaRoot.sessionRsvp.findMany({ where, include: { session: { select: { title: true, startsAt: true } } } }),
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
    finances: { incomeEntries, expenses },
    automations: { commentTriggers },
    brandReviews,
    wellbeing: { contentBank, restPeriods },
    shop: { products },
    circles: { circleMemberships, circleMessages, sessionRsvps },
    support: { supportTickets, ideas, dataRequests },
  };
}

/** Nombre del archivo de la copia, p. ej. "foliocrew-cristal-2026-10-05.json". */
export const exportFileName = (slug: string) => `foliocrew-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
