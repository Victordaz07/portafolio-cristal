import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { prismaRoot } from "./prisma-root";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { mailLangFor } from "./email-lang";
import { platformOrigin } from "./site-url";
import { formatCents, invoiceNumber, itemsTotal, parseParty, type InvoiceItem } from "./invoices";
import { dateInputToDate } from "./crm";
import { paymentNotice } from "@/lib/push";
import { sendPush } from "@/lib/push-server";

// Facturas (B3): lo que necesita el servidor. Dentro del panel se usa `prisma` (solo la cuenta
// de la sesión); la página pública y el cron usan `prismaRoot` y buscan por el token o el id.

/** Datos para facturar de la cuenta (si no existen, se crean con lo que ya hay en Foliocrew). */
export async function getBillingProfile() {
  const existing = await prisma.billingProfile.findFirst();
  if (existing) return existing;
  const [creatorName, settings] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true } }).then((h) => h?.name ?? ""),
    prisma.siteSettings.findFirst({ select: { contactEmail: true, collabsEmail: true } }),
  ]);
  return prisma.billingProfile
    .create({ data: { legalName: creatorName, email: settings?.collabsEmail || settings?.contactEmail || "" } })
    .catch(async (error) => {
      const again = await prisma.billingProfile.findFirst();
      if (again) return again;
      throw error;
    });
}

/** Siguiente número de factura de la cuenta (lo reserva de forma atómica). */
async function reserveNumber() {
  const profile = await getBillingProfile();
  const updated = await prisma.billingProfile.update({ where: { id: profile.id }, data: { nextNumber: { increment: 1 } } });
  return invoiceNumber(updated.invoicePrefix, new Date().getUTCFullYear(), updated.nextNumber - 1);
}

export type InvoiceInput = {
  brandId?: string | null;
  kind?: "full" | "deposit" | "balance";
  currency?: string;
  items: InvoiceItem[];
  notes?: string;
  payTo?: string;
  billTo: { name: string; company?: string; email?: string };
  language?: "es" | "en";
  issuedAt?: string;
  dueAt: string;
};

export async function createInvoice(input: InvoiceInput) {
  const profile = await getBillingProfile();
  const number = await reserveNumber();
  const subtotal = itemsTotal(input.items);
  return prisma.invoice.create({
    data: {
      brandId: input.brandId || null,
      number,
      publicToken: randomBytes(32).toString("base64url"),
      kind: input.kind ?? "full",
      currency: input.currency ?? "USD",
      items: input.items,
      subtotal,
      notes: input.notes ?? profile.defaultNotes,
      payTo: input.payTo ?? profile.payTo,
      billTo: input.billTo,
      issuer: { name: profile.legalName, location: profile.location, email: profile.email },
      language: input.language ?? "es",
      issuedAt: input.issuedAt ? dateInputToDate(input.issuedAt) : new Date(),
      dueAt: dateInputToDate(input.dueAt),
    },
  });
}

/** El trato pasa a "pagado" cuando todas sus facturas (no anuladas) están pagadas, y a "pendiente" si no. */
export async function syncBrandPayment(brandId: string | null | undefined) {
  if (!brandId) return;
  const invoices = await prisma.invoice.findMany({ where: { brandId, status: { not: "void" } }, select: { status: true } });
  const billed = invoices.filter((i) => i.status !== "draft");
  if (!billed.length) return;
  const paymentStatus = billed.every((i) => i.status === "paid") ? "paid" : "pending";
  await prisma.brand.updateMany({ where: { id: brandId }, data: { paymentStatus } });
}

export const invoiceLink = (origin: string, token: string) => `${origin}/f/${token}`;

type InvoiceForMail = { number: string; publicToken: string; subtotal: number; currency: string; dueAt: Date; language: string; billTo: unknown; issuer: unknown };

/** Correo a la marca con el enlace de la factura (o un recordatorio amable si `reminder` > 0). */
export async function emailInvoiceToBrand(invoice: InvoiceForMail, reminder = 0) {
  const billTo = parseParty(invoice.billTo);
  if (!billTo.email) return { sent: false as const, reason: "no_email" };
  const issuer = parseParty(invoice.issuer);
  const origin = await platformOrigin();
  const en = invoice.language === "en";
  const lang = en ? "en" : "es";
  const total = formatCents(invoice.subtotal, invoice.currency, lang);
  const due = invoice.dueAt.toLocaleDateString(en ? "en-US" : "es-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const from = issuer.name || "Foliocrew";
  const subject =
    reminder === 0
      ? en ? `Invoice ${invoice.number} from ${from}` : `Factura ${invoice.number} de ${from}`
      : en ? `Friendly reminder: invoice ${invoice.number}` : `Recordatorio amable: factura ${invoice.number}`;
  const lines =
    reminder === 0
      ? [en ? `${from} sent you invoice ${invoice.number} for ${total}, due ${due}.` : `${from} te envió la factura ${invoice.number} por ${total}, con vencimiento el ${due}.`]
      : [
          en
            ? `Just a friendly reminder that invoice ${invoice.number} for ${total} was due ${due}. If you already paid, thank you, and you can let us know with the "We paid" button.`
            : `Solo un recordatorio amable: la factura ${invoice.number} por ${total} venció el ${due}. Si ya la pagaron, ¡gracias! Pueden avisar con el botón "Ya pagamos".`,
        ];
  const mail = noticeEmail({
    lang,
    origin,
    name: billTo.name || null,
    subject,
    title: en ? `Invoice ${invoice.number}` : `Factura ${invoice.number}`,
    lines,
    button: { label: en ? "View invoice" : "Ver la factura", url: invoiceLink(origin, invoice.publicToken) },
    note: en ? "You can download it as a PDF from the same page." : "Desde la misma página la pueden descargar en PDF.",
  });
  return sendEmail({ to: billTo.email, ...mail });
}

/** Aviso al creador: la marca vio la factura, venció, o dice que ya pagó. */
export async function notifyCreatorAboutInvoice(kind: "viewed" | "overdue" | "claimed", invoice: { creatorId: string; id: string; number: string; subtotal: number; currency: string; billTo: unknown }) {
  try {
    const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId: invoice.creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } });
    if (!owner) return;
    const origin = await platformOrigin();
    const lang = await mailLangFor(owner.email);
    const en = lang === "en";
    const brand = parseParty(invoice.billTo).company || parseParty(invoice.billTo).name || (en ? "The brand" : "La marca");
    const total = formatCents(invoice.subtotal, invoice.currency, lang);
    const text = {
      viewed: en ? [`${brand} opened invoice ${invoice.number}`, `${brand} just opened your invoice ${invoice.number} (${total}).`] : [`${brand} abrió la factura ${invoice.number}`, `${brand} acaba de abrir tu factura ${invoice.number} (${total}).`],
      overdue: en
        ? [`Invoice ${invoice.number} is overdue`, `Invoice ${invoice.number} (${total}) to ${brand} is past due. We already sent them a friendly reminder and will send more at 7 and 14 days.`]
        : [`La factura ${invoice.number} venció`, `La factura ${invoice.number} (${total}) a ${brand} ya venció. Ya le enviamos un recordatorio amable y le enviaremos otros a los 7 y 14 días.`],
      claimed: en
        ? [`${brand} says they paid ${invoice.number}`, `${brand} marked invoice ${invoice.number} (${total}) as paid. Check your account and confirm it in Foliocrew.`]
        : [`${brand} dice que ya pagó la ${invoice.number}`, `${brand} marcó como pagada la factura ${invoice.number} (${total}). Revisa tu cuenta y confírmalo en Foliocrew.`],
    }[kind];
    const mail = noticeEmail({
      lang,
      origin,
      name: owner.name,
      subject: text[0],
      title: text[0],
      lines: [text[1]],
      button: { label: en ? "Open the invoice" : "Abrir la factura", url: `${origin}/admin/facturas/${invoice.id}` },
    });
    await sendEmail({ to: owner.email, ...mail });
    // Aviso en el celular (E5): solo cuando la marca dice que ya pagó.
    if (kind === "claimed") {
      const company = parseParty(invoice.billTo).company || parseParty(invoice.billTo).name || undefined;
      await sendPush(invoice.creatorId, "payment", (l) => paymentNotice("claimed", { number: invoice.number, brand: company }, l), { key: `claimed:${invoice.id}` });
    }
  } catch (error) {
    console.error("No se pudo avisar de la factura", error);
  }
}
