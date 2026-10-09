import { prismaRoot } from "./prisma-root";
import { adminEmails, logPlatformAction } from "./platform-admin";
import { sendEmail } from "./email";
import { platformOrigin } from "./site-url";
import { billingState, extendPaidUntil, formatMoney, paymentMethodLabel } from "./billing";
import { agencyTeamEmails } from "./agency";

// Lado servidor del cobro manual de una agencia (plan Crew) — mismo flujo que lib/billing-server.ts
// (PayPal/transferencia, "ya pagué", confirmar/rechazar, recordatorio diario), pero sobre
// AgencyPayment/Agency en vez de Payment/Creator: una agencia paga una sola vez por toda su cartera.

export async function notifyAgencyPaymentReported(paymentId: string) {
  const payment = await prismaRoot.agencyPayment.findUnique({ where: { id: paymentId }, include: { agency: { select: { id: true, name: true } } } });
  if (!payment) return;
  const origin = await platformOrigin();
  const amount = formatMoney(payment.amountCents, payment.currency);
  for (const to of adminEmails()) {
    await sendEmail({
      to,
      subject: `Pago reportado · ${payment.agency.name}`,
      text: `${payment.agency.name} avisó un pago de ${amount} (${paymentMethodLabel(payment.method)}). Ref.: ${payment.reference || "—"}. Confírmalo en ${origin}/admin/plataforma`,
      html: `<p><strong>${payment.agency.name}</strong> avisó un pago de <strong>${amount}</strong> (${paymentMethodLabel(payment.method)}).</p><p>Ref.: ${payment.reference || "—"}${payment.note ? ` · ${payment.note}` : ""}</p><p><a href="${origin}/admin/plataforma">Confirmarlo</a></p>`,
    });
  }
}

/** Confirma el pago de una agencia: extiende "pagado hasta" y avisa a su equipo. */
export async function confirmAgencyPayment(paymentId: string, actorEmail: string) {
  const payment = await prismaRoot.agencyPayment.findUnique({ where: { id: paymentId }, include: { agency: true } });
  if (!payment || payment.status === "confirmed") return null;
  const paidUntil = extendPaidUntil(payment.agency.paidUntil, payment.months);
  await prismaRoot.$transaction([
    prismaRoot.agencyPayment.update({ where: { id: paymentId }, data: { status: "confirmed", confirmedAt: new Date(), periodEnd: paidUntil } }),
    prismaRoot.agency.update({ where: { id: payment.agencyId }, data: { paidUntil, billingReminder: null } }),
  ]);
  await logPlatformAction(actorEmail, "payment", null, `Agencia ${payment.agency.name}: ${formatMoney(payment.amountCents)} hasta ${paidUntil.toISOString().slice(0, 10)}`);
  const origin = await platformOrigin();
  for (const to of await agencyTeamEmails(payment.agencyId)) {
    await sendEmail({
      to,
      subject: "Recibimos tu pago",
      text: `Tu pago de ${formatMoney(payment.amountCents, payment.currency)} quedó confirmado. Tu plan Crew sigue activo hasta ${paidUntil.toISOString().slice(0, 10)}. ${origin}/admin/agencia/facturacion`,
      html: `<p>Tu pago de <strong>${formatMoney(payment.amountCents, payment.currency)}</strong> quedó confirmado.</p><p>Tu plan Crew sigue activo hasta ${paidUntil.toISOString().slice(0, 10)}.</p><p><a href="${origin}/admin/agencia/facturacion">Ver facturación</a></p>`,
    });
  }
  return paidUntil;
}

export async function rejectAgencyPayment(paymentId: string, actorEmail: string) {
  const payment = await prismaRoot.agencyPayment.findUnique({ where: { id: paymentId }, include: { agency: { select: { name: true } } } });
  if (!payment || payment.status !== "reported") return false;
  await prismaRoot.agencyPayment.update({ where: { id: paymentId }, data: { status: "rejected" } });
  await logPlatformAction(actorEmail, "payment-rejected", null, `Agencia ${payment.agency.name}: ${formatMoney(payment.amountCents)}`);
  for (const to of await agencyTeamEmails(payment.agencyId)) {
    await sendEmail({
      to,
      subject: "No encontramos tu pago",
      text: "No encontramos tu pago. Escríbenos con el comprobante para confirmarlo.",
      html: "<p>No encontramos tu pago. Escríbenos con el comprobante para confirmarlo.</p>",
    });
  }
  return true;
}

/** Recordatorio diario (cron), mismo patrón que sendBillingReminders() pero por agencia. */
export async function sendAgencyBillingReminders(now = new Date()) {
  const agencies = await prismaRoot.agency.findMany({
    where: { comp: false, status: "active" },
    select: { id: true, name: true, comp: true, trialEndsAt: true, paidUntil: true, billingReminder: true },
  });
  const origin = await platformOrigin();
  let sent = 0;
  for (const a of agencies) {
    const { state, until, daysLeft } = billingState({ ...a, plan: "crew" }, now);
    if (!until || daysLeft === null) continue;
    let kind: "trial-ending" | "renewal-due" | "expired" | null = null;
    if (state === "trial" && daysLeft <= 3) kind = "trial-ending";
    else if (state === "active" && daysLeft <= 5) kind = "renewal-due";
    else if (state === "expired" && daysLeft >= -7) kind = "expired";
    if (!kind) continue;
    const key = `${kind}:${until.toISOString().slice(0, 10)}`;
    if (a.billingReminder === key) continue;
    const emails = await agencyTeamEmails(a.id);
    if (!emails.length) continue;
    const date = until.toISOString().slice(0, 10);
    const subject =
      kind === "trial-ending" ? "Tu prueba de Crew termina pronto" : kind === "renewal-due" ? "Tu plan Crew vence pronto" : "Tu plan Crew venció";
    const body = kind === "expired" ? `Tu plan venció el ${date}. Renueva para seguir sin cortes.` : `Tu plan vence el ${date}.`;
    for (const to of emails) {
      await sendEmail({ to, subject, text: `${body} Paga en ${origin}/admin/agencia/facturacion`, html: `<p>${body}</p><p><a href="${origin}/admin/agencia/facturacion">Ver cómo pagar</a></p>` });
    }
    await prismaRoot.agency.update({ where: { id: a.id }, data: { billingReminder: key } });
    sent += 1;
  }
  return sent;
}
