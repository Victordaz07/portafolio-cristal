import { NextResponse } from "next/server";
import { z } from "zod";
import { httpUrl } from "@/lib/validators";
import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { parseEmbedUrl } from "@/lib/embeds";
import { ACCENTS } from "@/lib/theme";
import { getNiche, siteTemplate } from "@/lib/onboarding";
import { CREATOR_KINDS, type CreatorKind } from "@/lib/creator-kind";
import { sessionCreatorSite } from "@/lib/site-url";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const handle = z.string().trim().max(60).transform((h) => h.replace(/^@/, ""));

const onboardingSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  photoUrl: z.union([httpUrl(), z.string().regex(/^\/[^\s]*$/), z.literal("")]),
  location: z.string().trim().max(80),
  niche: z.string(),
  creatorKind: z.enum(CREATOR_KINDS.map((k) => k.id) as [CreatorKind, ...CreatorKind[]]).default("contenido"),
  bio: z.string().trim().min(10).max(600),
  bioEn: z.string().trim().max(600),
  useTemplates: z.object({ services: z.boolean(), packages: z.boolean(), faq: z.boolean() }),
  pieces: z
    .array(z.object({ url: z.string().trim().url(), caption: z.string().trim().max(200) }))
    .max(3),
  contactEmail: z.string().trim().email(),
  instagram: handle,
  tiktok: handle,
  whatsapp: z.string().trim().max(30),
  accentColor: z.enum(Object.keys(ACCENTS) as [string, ...string[]]),
});

/** Termina el asistente: arma el sitio con lo que eligió la creadora. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: t(`Revisa ${issue?.path.join(".") || "los datos"}`, `Check ${issue?.path.join(".") || "the details"}`) }, { status: 400 });
  }
  const d = parsed.data;
  for (const piece of d.pieces) {
    if (!parseEmbedUrl(piece.url).platform) {
      return NextResponse.json({ error: t(`Ese link no es de Instagram, TikTok ni Facebook: ${piece.url}`, `That link isn't from Instagram, TikTok or Facebook: ${piece.url}`) }, { status: 400 });
    }
  }
  const niche = getNiche(d.niche);
  const template = siteTemplate(niche, d.creatorKind);

  const [hero, settings, services, packages, faqs, cards] = await Promise.all([
    prisma.hero.findFirst({ select: { id: true } }),
    prisma.siteSettings.findFirst({ select: { id: true } }),
    prisma.service.count(),
    prisma.package.count(),
    prisma.faqItem.count(),
    prisma.contentCard.count(),
  ]);
  if (!hero || !settings) return NextResponse.json({ error: t("Tu cuenta no tiene sitio inicial", "Your account has no starter site") }, { status: 400 });

  await prisma.$transaction([
    prisma.hero.update({
      where: { id: hero.id },
      data: {
        ...template.hero,
        name: d.displayName,
        location: d.location,
        description: d.bio,
        descriptionEn: d.bioEn || null,
        photoUrl: d.photoUrl || null,
      },
    }),
    prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        whyMeText: template.whyMe.es,
        whyMeTextEn: template.whyMe.en,
        contactEmail: d.contactEmail,
        collabsEmail: d.contactEmail,
        instagramHandle: d.instagram,
        tiktokHandle: d.tiktok,
        whatsapp: d.whatsapp || null,
        accentColor: d.accentColor,
      },
    }),
    // Las plantillas solo se agregan si la sección está vacía (nunca se duplica ni se pisa nada).
    ...(d.useTemplates.services && services === 0
      ? [prisma.service.createMany({ data: template.services.map((s, order) => ({ ...s, order })) })]
      : []),
    ...(d.useTemplates.packages && packages === 0
      ? [prisma.package.createMany({ data: template.packages.map((p, order) => ({ ...p, order })) })]
      : []),
    ...(d.useTemplates.faq && faqs === 0
      ? [prisma.faqItem.createMany({ data: template.faq.map((f, order) => ({ ...f, order })) })]
      : []),
    ...d.pieces.map((piece, i) => {
      const { platform, inferredType } = parseEmbedUrl(piece.url);
      return prisma.contentCard.create({
        data: {
          type: inferredType ?? "video",
          platform: platform!,
          postUrl: piece.url,
          caption: piece.caption || "Mi contenido",
          category: niche.label,
          categoryEn: niche.labelEn,
          order: cards + i,
        },
      });
    }),
  ]);
  await prismaRoot.creator.update({ where: { id: session.creatorId }, data: { onboardedAt: new Date(), creatorKind: d.creatorKind } });
  return NextResponse.json({ ok: true, siteUrl: (await sessionCreatorSite())?.url ?? "" });
}

/** "Saltar por ahora": no vuelve a mostrar el asistente. */
export async function PATCH() {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  await prismaRoot.creator.update({ where: { id: session.creatorId }, data: { onboardedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
