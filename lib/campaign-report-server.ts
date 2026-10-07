import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { prismaRoot } from "./prisma-root";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { mailLangFor } from "./email-lang";
import { platformOrigin } from "./site-url";
import { buildReportData, type ReportData } from "./campaign-report";

// Reporte de campaña (C3): lo que necesita el servidor. En el panel se usa `prisma` (solo la cuenta de la sesión);
// la página pública usa `prismaRoot` y busca por el token.

export const reportLink = (origin: string, token: string) => `${origin}/r/${token}`;

/** Arma la «foto» de los números de una marca: sus publicaciones, sus entregables hechos y la base de comparación de la creadora. */
export async function snapshotFor(brandId: string, previous?: ReportData | null) {
  const [cards, deliverables, allCards] = await Promise.all([
    prisma.contentCard.findMany({
      where: { brandId },
      orderBy: { createdAt: "asc" },
      select: { id: true, platform: true, postUrl: true, thumbnailUrl: true, caption: true, views: true, likes: true, comments: true, shares: true, saves: true, topComment: true, topCommentAuthor: true },
    }),
    prisma.deliverable.findMany({ where: { brandId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, title: true, network: true, proofUrl: true, status: true } }),
    // La base de comparación: lo que esta persona suele lograr con el resto de sus publicaciones.
    prisma.contentCard.findMany({ where: { OR: [{ brandId: null }, { brandId: { not: brandId } }] }, select: { views: true, likes: true, comments: true, shares: true, saves: true } }),
  ]);
  return buildReportData({ cards, deliverables, baselineCards: allCards, previous });
}

/** Crea el reporte en borrador (o devuelve el borrador que ya existe de esa marca). */
export async function createReportDraft(brandId: string, lang: "es" | "en") {
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, name: true } });
  if (!brand) return null;
  const existing = await prisma.campaignReport.findFirst({ where: { brandId, status: "draft" }, orderBy: { createdAt: "desc" } });
  if (existing) return { report: existing, created: false as const };
  const data = await snapshotFor(brandId);
  const report = await prisma.campaignReport.create({
    data: {
      brandId,
      publicToken: randomBytes(32).toString("base64url"),
      language: lang,
      title: lang === "en" ? `Campaign report · ${brand.name}` : `Reporte de campaña · ${brand.name}`,
      data: data as object,
    },
  });
  return { report, created: true as const };
}

type ReportRow = { id: string; creatorId: string; brandId: string; title: string; language: string; publicToken: string; intro: string | null };

/** Correo a la marca con el enlace al reporte. */
export async function emailReportToBrand(report: ReportRow, to: string, brandName: string | null) {
  const origin = await platformOrigin();
  const en = report.language === "en";
  const creator = await prismaRoot.creator.findUnique({ where: { id: report.creatorId }, select: { name: true } });
  const from = creator?.name || "Foliocrew";
  const mail = noticeEmail({
    lang: en ? "en" : "es",
    origin,
    name: brandName,
    subject: en ? `${from} shared the results of your campaign` : `${from} te compartió los resultados de la campaña`,
    title: report.title,
    lines: [
      en
        ? `${from} put together a report with the results of your collaboration. You can see the posts, the numbers and how they compare.`
        : `${from} armó un reporte con los resultados de su colaboración. Puedes ver las publicaciones, los números y cómo se comparan.`,
    ],
    quote: report.intro || undefined,
    button: { label: en ? "See the results" : "Ver los resultados", url: reportLink(origin, report.publicToken) },
  });
  return sendEmail({ to, ...mail });
}

/** Aviso a la creadora: la marca abrió el reporte por primera vez. */
export async function notifyCreatorReportViewed(report: ReportRow, brandName: string) {
  try {
    const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId: report.creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } });
    if (!owner) return;
    const origin = await platformOrigin();
    const lang = await mailLangFor(owner.email);
    const en = lang === "en";
    const mail = noticeEmail({
      lang,
      origin,
      name: owner.name,
      subject: en ? `${brandName} opened your campaign report` : `${brandName} abrió tu reporte de campaña`,
      title: en ? `${brandName} opened the report` : `${brandName} abrió el reporte`,
      lines: [en ? `${brandName} just opened “${report.title}”. It's a good moment to ask: shall we do it again?` : `${brandName} acaba de abrir «${report.title}». Es un buen momento para preguntar: ¿repetimos?`],
      button: { label: en ? "Open the report" : "Abrir el reporte", url: `${origin}/admin/campanas/${report.id}` },
    });
    await sendEmail({ to: owner.email, ...mail });
  } catch (error) {
    console.error("No se pudo avisar de que abrieron el reporte", error);
  }
}
