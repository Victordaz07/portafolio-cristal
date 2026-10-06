import { prismaRoot } from "./prisma-root";
import { adminEmails, logPlatformAction } from "./platform-admin";
import { sendEmail } from "./email";
import {
  billingReminderEmail,
  paymentConfirmedEmail,
  paymentRejectedEmail,
  paymentReportedAdminEmail,
  type ReminderKind,
} from "./email-templates";
import { platformOrigin } from "./site-url";
import { billingState, extendPaidUntil, formatMoney, getPlan, paymentMethodLabel } from "./billing";
import { asMailLang, mailDate, mailLangFor } from "./email-lang";

// Lado servidor del cobro manual: reportar, registrar, confirmar y rechazar pagos, y recordatorios.

const fmtDate = (d: Date, lang: "es" | "en" = "es") => mailDate(d, lang);
const methodLabel = (m: string, lang: "es" | "en" = "es") => paymentMethodLabel(m, lang);

async function ownerOf(creatorId: string) {
  return prismaRoot.adminUser.findFirst({
    where: { creatorId, role: "owner" },
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true, language: true },
  });
}

/** Avisa a quien administra Foliocrew que alguien reportó un pago. */
export async function notifyPaymentReported(paymentId: string) {
  const payment = await prismaRoot.payment.findUnique({
    where: { id: paymentId },
    include: { creator: { select: { id: true, name: true } } },
  });
  if (!payment) return;
  const owner = await ownerOf(payment.creatorId);
  const origin = await platformOrigin();
  for (const to of adminEmails()) {
    const lang = await mailLangFor(to);
    const mail = paymentReportedAdminEmail({
      lang,
      origin,
      creatorName: payment.creator.name,
      email: owner?.email ?? "—",
      plan: getPlan(payment.plan).name,
      months: payment.months,
      amount: formatMoney(payment.amountCents, payment.currency),
      method: methodLabel(payment.method, lang),
      reference: payment.reference,
      note: payment.note,
      accountUrl: `${origin}/admin/plataforma/${payment.creatorId}`,
    });
    await sendEmail({ to, ...mail, replyTo: owner?.email });
  }
}

/** Confirma un pago: extiende "pagado hasta", fija el plan y avisa por correo. */
export async function confirmPayment(paymentId: string, actorEmail: string) {
  const payment = await prismaRoot.payment.findUnique({ where: { id: paymentId }, include: { creator: true } });
  if (!payment || payment.status === "confirmed") return null;
  const paidUntil = extendPaidUntil(payment.creator.paidUntil, payment.months);
  await prismaRoot.$transaction([
    prismaRoot.payment.update({ where: { id: paymentId }, data: { status: "confirmed", confirmedAt: new Date(), periodEnd: paidUntil } }),
    prismaRoot.creator.update({ where: { id: payment.creatorId }, data: { plan: payment.plan, paidUntil, billingReminder: null } }),
  ]);
  await logPlatformAction(actorEmail, "payment", payment.creatorId, `${formatMoney(payment.amountCents)} · ${methodLabel(payment.method)} · hasta ${fmtDate(paidUntil)}`);
  const owner = await ownerOf(payment.creatorId);
  if (owner) {
    const origin = await platformOrigin();
    const lang = asMailLang(owner.language);
    const mail = paymentConfirmedEmail({
      lang,
      origin,
      name: owner.name,
      plan: getPlan(payment.plan).name,
      amount: formatMoney(payment.amountCents, payment.currency),
      paidUntil: fmtDate(paidUntil, lang),
      planUrl: `${origin}/admin/plan`,
    });
    await sendEmail({ to: owner.email, ...mail });
  }
  return paidUntil;
}

export async function rejectPayment(paymentId: string, actorEmail: string) {
  const payment = await prismaRoot.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "reported") return false;
  await prismaRoot.payment.update({ where: { id: paymentId }, data: { status: "rejected" } });
  await logPlatformAction(actorEmail, "payment-rejected", payment.creatorId, formatMoney(payment.amountCents));
  const owner = await ownerOf(payment.creatorId);
  if (owner) {
    const origin = await platformOrigin();
    const mail = paymentRejectedEmail({ lang: asMailLang(owner.language), origin, name: owner.name, amount: formatMoney(payment.amountCents, payment.currency), planUrl: `${origin}/admin/plan` });
    await sendEmail({ to: owner.email, ...mail, replyTo: adminEmails()[0] });
  }
  return true;
}

/**
 * Recordatorios diarios (cron): prueba que termina en 3 días, plan que vence en 5 días y plan vencido.
 * Cada recordatorio se manda una sola vez (Creator.billingReminder guarda el último).
 */
export async function sendBillingReminders(now = new Date()) {
  const creators = await prismaRoot.creator.findMany({
    where: { comp: false, ambassador: false, status: "active" },
    select: { id: true, plan: true, comp: true, trialEndsAt: true, paidUntil: true, billingReminder: true },
  });
  const origin = await platformOrigin();
  let sent = 0;
  for (const c of creators) {
    const { state, until, daysLeft } = billingState(c, now);
    if (!until || daysLeft === null) continue;
    let kind: ReminderKind | null = null;
    if (state === "trial" && daysLeft <= 3) kind = "trial-ending";
    else if (state === "active" && daysLeft <= 5) kind = "renewal-due";
    else if (state === "expired" && daysLeft >= -7) kind = "expired";
    if (!kind) continue;
    const key = `${kind}:${until.toISOString().slice(0, 10)}`;
    if (c.billingReminder === key) continue;
    const owner = await ownerOf(c.id);
    if (!owner) continue;
    const lang = asMailLang(owner.language);
    const mail = billingReminderEmail({ lang, origin, name: owner.name, kind, date: fmtDate(until, lang), days: Math.max(daysLeft, 0), planUrl: `${origin}/admin/plan` });
    const result = await sendEmail({ to: owner.email, ...mail });
    if (!result.sent) continue;
    await prismaRoot.creator.update({ where: { id: c.id }, data: { billingReminder: key } });
    sent += 1;
  }
  return sent;
}
