import { prisma, prismaRoot } from "@/lib/prisma";
import { currentCreatorId } from "@/lib/tenant";
import { sendEmail } from "@/lib/email";
import { brandMessageEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { followUpDate } from "@/lib/pitch";
import { dealStatusAfterRequest, requestSummary, type PackageRequestInput } from "@/lib/package-request";

// Lado servidor de «solicitar un paquete» (C2). Lo llama la ruta pública /api/package-request: no hay sesión,
// la cuenta sale del sitio donde se abrió el formulario (lib/tenant.ts).

/** Tope de solicitudes por cuenta cada 24 h: protege el CRM de quien llene el formulario con basura. */
export const DAILY_REQUEST_CAP = 30;
const DAY = 86_400_000;

export type PackageRequestResult = { ok: true; duplicate?: boolean } | { ok: false; reason: "not_found" | "too_many" };

export async function createPackageRequest(input: PackageRequestInput): Promise<PackageRequestResult> {
  const pkg = await prisma.package.findUnique({ where: { id: input.packageId } });
  if (!pkg || !pkg.requestable) return { ok: false, reason: "not_found" };

  const since = new Date(Date.now() - DAY);
  const type = `Paquete: ${pkg.name}`;
  // La misma persona pidiendo lo mismo dos veces el mismo día cuenta una sola vez.
  const same = await prisma.contactMessage.count({ where: { email: { equals: input.email, mode: "insensitive" }, collaborationType: type, createdAt: { gte: since } } });
  if (same > 0) return { ok: true, duplicate: true };
  const today = await prisma.contactMessage.count({ where: { collaborationType: { startsWith: "Paquete: " }, createdAt: { gte: since } } });
  if (today >= DAILY_REQUEST_CAP) return { ok: false, reason: "too_many" };

  const creatorId = await currentCreatorId();
  const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true, language: true } });
  const ownerLang = owner?.language === "en" ? "en" : "es";
  const summary = requestSummary({ packageName: pkg.name, budget: input.budget, currency: pkg.currency, startDate: input.startDate, endDate: input.endDate, lang: ownerLang });
  const eventNote = ownerLang === "en" ? `Requested the package “${pkg.name}”` : `Solicitó el paquete «${pkg.name}»`;
  const nextAction = ownerLang === "en" ? "Reply to the package request" : "Responder la solicitud del paquete";
  const notes = `${summary}\n\n${input.brief}`;
  const now = new Date();

  // Se guarda siempre en la Bandeja: aunque falle el correo o el CRM, la persona lo ve.
  await prisma.contactMessage.create({ data: { name: input.contactName, brand: input.brandName, email: input.email, collaborationType: type, message: notes } });

  const existing = await prisma.brand.findFirst({
    where: { name: { equals: input.brandName, mode: "insensitive" }, contactEmail: { equals: input.email, mode: "insensitive" } },
    select: { id: true, dealStatus: true, notes: true },
  });
  const common = { lastContactAt: now, nextAction, nextActionDue: followUpDate(now, 2), packageDetail: summary };
  if (existing) {
    await prisma.brand.update({
      where: { id: existing.id },
      data: {
        ...common,
        dealStatus: dealStatusAfterRequest(existing.dealStatus),
        notes: [existing.notes, notes].filter(Boolean).join("\n\n— — —\n\n").slice(-4000),
        // Un BrandEvent anidado no pasa por lib/prisma.ts (tenant): lleva su creatorId.
        events: { create: [{ note: eventNote, creatorId }] },
      },
    });
  } else {
    const maxOrder = await prisma.brand.aggregate({ _max: { order: true } });
    await prisma.brand.create({
      data: {
        name: input.brandName,
        contactName: input.contactName,
        contactEmail: input.email,
        dealStatus: "negotiating",
        // Una marca nueva que escribió desde el sitio no debe salir en el carrusel público hasta que la creadora decida.
        active: false,
        order: (maxOrder._max.order ?? -1) + 1,
        notes,
        ...common,
        events: { create: [{ note: eventNote, creatorId }] },
      },
    });
  }

  try {
    const settings = await prisma.siteSettings.findFirst({ select: { contactEmail: true } });
    const to = settings?.contactEmail || owner?.email;
    if (to) {
      const origin = await platformOrigin();
      const crmNote = ownerLang === "en" ? "It's already saved in your CRM (Brands) as “Negotiating”." : "Ya quedó guardado en tu CRM (Marcas) como «Negociando».";
      const mail = brandMessageEmail({
        lang: ownerLang,
        origin,
        creatorName: owner?.name ?? null,
        fromName: input.contactName,
        brand: input.brandName,
        fromEmail: input.email,
        collaborationType: type,
        message: `${notes}\n\n${crmNote}`,
        inboxUrl: `${origin}/admin/marcas`,
      });
      await sendEmail({ to, ...mail, replyTo: input.email });
    }
  } catch (error) {
    console.error("No se pudo avisar por correo de la solicitud de paquete", error);
  }
  return { ok: true };
}
