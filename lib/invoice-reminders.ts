import { prismaRoot } from "./prisma-root";
import { calendarDays, reminderDue } from "./invoices";
import { emailInvoiceToBrand, notifyCreatorAboutInvoice } from "./invoices-server";

// Recordatorios de cobro (B3), dentro del cron diario de cobros: a la marca el día que vence y a los
// 7 y 14 días (máximo 3, con tono amable), y un aviso al creador cuando la factura vence.

export async function sendInvoiceReminders(now: Date = new Date()) {
  const due = await prismaRoot.invoice.findMany({
    where: { status: "sent", dueAt: { lte: new Date(now.getTime() + 86_400_000) }, creator: { status: "active" } },
    take: 500,
  });
  let brandReminders = 0;
  let creatorNotices = 0;
  for (const invoice of due) {
    try {
      if (calendarDays(invoice.dueAt, now) >= 1 && !invoice.overdueNotifiedAt) {
        await prismaRoot.invoice.update({ where: { id: invoice.id }, data: { overdueNotifiedAt: now } });
        await notifyCreatorAboutInvoice("overdue", invoice);
        creatorNotices++;
      }
      // Si la marca ya dijo que pagó, no se le insiste: falta que el creador lo confirme.
      if (!invoice.claimedPaidAt && reminderDue(invoice, now)) {
        await prismaRoot.invoice.update({ where: { id: invoice.id }, data: { lastReminderAt: now, remindersSent: { increment: 1 } } });
        await emailInvoiceToBrand(invoice, invoice.remindersSent + 1);
        brandReminders++;
      }
    } catch (error) {
      console.error("Falló un recordatorio de factura", invoice.id, error);
    }
  }
  return { brandReminders, creatorNotices };
}
