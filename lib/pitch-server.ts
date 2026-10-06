import { prisma } from "@/lib/prisma";
import { brandCrmInclude } from "@/lib/brand-crm";
import { currentCreatorId } from "@/lib/tenant";
import { FOLLOW_UP_DAYS, followUpDate } from "@/lib/pitch";

// Lado servidor de las propuestas a marcas (C1): guardar en el CRM, marcar seguimientos y respuestas.
// Los BrandEvent anidados no pasan por lib/prisma.ts (tenant): llevan su creatorId explícito.

type Lang = "es" | "en";
const tx = (lang: Lang, es: string, en: string) => (lang === "en" ? en : es);

export interface SavePitchInput {
  brandId?: string;
  brandName: string;
  websiteUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  offer: string;
  subject: string;
  lang: Lang;
}

/** Guarda la propuesta en el CRM: crea la marca como prospecto (oculta del sitio público) o la agrega a una existente. */
export async function savePitch(input: SavePitchInput) {
  const creatorId = await currentCreatorId();
  const now = new Date();
  const common = {
    pitchSentAt: now,
    pitchFollowUps: 0,
    pitchRepliedAt: null,
    pitchOffer: input.offer.slice(0, 500),
    lastContactAt: now,
    nextAction: tx(input.lang, "Seguimiento 1 de la propuesta", "Proposal follow-up 1"),
    nextActionDue: followUpDate(now, FOLLOW_UP_DAYS[0]),
  };
  const eventNote = tx(input.lang, `Propuesta enviada: ${input.subject}`, `Proposal sent: ${input.subject}`);

  if (input.brandId) {
    const before = await prisma.brand.findUnique({ where: { id: input.brandId }, select: { dealStatus: true } });
    if (!before) return null;
    return prisma.brand.update({
      where: { id: input.brandId },
      data: {
        ...common,
        // Si la marca solo estaba en el carrusel (sin trato), pasa a prospecto; si ya tenía un trato, conserva su estado.
        ...(before.dealStatus ? {} : { dealStatus: "prospect" }),
        ...(input.contactName ? { contactName: input.contactName } : {}),
        ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
        events: { create: [{ note: eventNote, creatorId }] },
      },
      include: brandCrmInclude,
    });
  }

  const maxOrder = await prisma.brand.aggregate({ _max: { order: true } });
  return prisma.brand.create({
    data: {
      name: input.brandName,
      websiteUrl: input.websiteUrl || null,
      contactName: input.contactName || null,
      contactEmail: input.contactEmail || null,
      dealStatus: "prospect",
      // Un prospecto nuevo no debería aparecer en el sitio público hasta que se decida.
      active: false,
      order: (maxOrder._max.order ?? -1) + 1,
      ...common,
      events: { create: [{ note: eventNote, creatorId }] },
    },
    include: brandCrmInclude,
  });
}

/** «Ya envié el seguimiento»: suma uno, deja anotado en el historial y programa el siguiente (o cierra el hilo). */
export async function markFollowUpSent(brandId: string, lang: Lang) {
  const creatorId = await currentCreatorId();
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { pitchSentAt: true, pitchFollowUps: true, pitchRepliedAt: true } });
  if (!brand?.pitchSentAt || brand.pitchRepliedAt || brand.pitchFollowUps >= FOLLOW_UP_DAYS.length) return null;
  const done = brand.pitchFollowUps + 1;
  const last = done >= FOLLOW_UP_DAYS.length;
  return prisma.brand.update({
    where: { id: brandId },
    data: {
      pitchFollowUps: done,
      lastContactAt: new Date(),
      nextAction: last
        ? tx(lang, "Sin respuesta tras 2 seguimientos: decide si cerrarlo", "No reply after 2 follow-ups: decide whether to close it")
        : tx(lang, "Seguimiento 2 de la propuesta", "Proposal follow-up 2"),
      nextActionDue: last ? null : followUpDate(brand.pitchSentAt, FOLLOW_UP_DAYS[done]),
      events: { create: [{ note: tx(lang, `Seguimiento ${done} enviado`, `Follow-up ${done} sent`), creatorId }] },
    },
    include: brandCrmInclude,
  });
}

/** «Respondieron»: deja de contar como sin respuesta y el prospecto pasa a negociación. */
export async function markReplied(brandId: string, lang: Lang) {
  const creatorId = await currentCreatorId();
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { pitchSentAt: true, pitchRepliedAt: true, dealStatus: true } });
  if (!brand?.pitchSentAt || brand.pitchRepliedAt) return null;
  const now = new Date();
  return prisma.brand.update({
    where: { id: brandId },
    data: {
      pitchRepliedAt: now,
      lastContactAt: now,
      ...(brand.dealStatus === "prospect" ? { dealStatus: "negotiating" } : {}),
      nextAction: null,
      nextActionDue: null,
      events: { create: [{ note: tx(lang, "La marca respondió la propuesta", "The brand replied to the proposal"), creatorId }] },
    },
    include: brandCrmInclude,
  });
}
