import { prismaRoot } from "./prisma-root";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { mailLangFor } from "./email-lang";
import { platformOrigin } from "./site-url";
import { daysFromNow, isDeliverableDone, shouldRemindDeliverable, shouldRemindRights, usageRightsEnd } from "./deliverables";

// Recordatorios de tratos (B2): entregas que vencen en 2 días y derechos de uso que vencen en 7.
// Corre dentro del cron diario de cobros (Vercel limita la cantidad de crons). Un correo por cuenta.

const DAY = 86_400_000;

type Line = { creatorId: string; es: string; en: string };

export async function sendDealReminders(now: Date = new Date()) {
  const [deliverables, brands] = await Promise.all([
    prismaRoot.deliverable.findMany({
      where: {
        remindedAt: null,
        dueAt: { gte: new Date(now.getTime() - 2 * DAY), lte: new Date(now.getTime() + 3 * DAY) },
        creator: { status: "active" },
      },
      select: { id: true, creatorId: true, title: true, status: true, dueAt: true, remindedAt: true, brand: { select: { name: true } } },
    }),
    prismaRoot.brand.findMany({
      where: { usageRightsDays: { not: null }, usageRightsStart: { not: null }, creator: { status: "active" } },
      select: { id: true, creatorId: true, name: true, usageRightsStart: true, usageRightsDays: true, usageReminderAt: true },
    }),
  ]);

  const dueNow = deliverables.filter((d) => !isDeliverableDone(d.status) && shouldRemindDeliverable(d, now));
  const rightsNow = brands.filter((b) => shouldRemindRights(b, now));

  const lines: Line[] = [
    ...dueNow.map((d) => {
      const days = daysFromNow(d.dueAt!, now);
      const when = days < 0 ? ["ya venció", "overdue"] : days === 0 ? ["vence hoy", "due today"] : days === 1 ? ["vence mañana", "due tomorrow"] : [`vence en ${days} días`, `due in ${days} days`];
      return { creatorId: d.creatorId, es: `📦 ${d.title} (${d.brand.name}) — ${when[0]}`, en: `📦 ${d.title} (${d.brand.name}) — ${when[1]}` };
    }),
    ...rightsNow.map((b) => {
      const days = daysFromNow(usageRightsEnd(b.usageRightsStart, b.usageRightsDays)!, now);
      return {
        creatorId: b.creatorId,
        es: `💰 Los derechos de uso de ${b.name} vencen ${days === 0 ? "hoy" : `en ${days} ${days === 1 ? "día" : "días"}`}: si la marca quiere seguir usando tu contenido, es momento de cobrar la renovación.`,
        en: `💰 ${b.name}'s usage rights expire ${days === 0 ? "today" : `in ${days} ${days === 1 ? "day" : "days"}`}: if the brand wants to keep using your content, it's time to charge for a renewal.`,
      };
    }),
  ];

  const byCreator = new Map<string, Line[]>();
  for (const l of lines) byCreator.set(l.creatorId, [...(byCreator.get(l.creatorId) ?? []), l]);

  let sent = 0;
  if (byCreator.size) {
    const origin = await platformOrigin();
    for (const [creatorId, items] of Array.from(byCreator)) {
      try {
        const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } });
        if (!owner) continue;
        const lang = await mailLangFor(owner.email);
        const en = lang === "en";
        const mail = noticeEmail({
          lang,
          origin,
          name: owner.name,
          subject: en ? "Reminder: deliveries and usage rights" : "Recordatorio: entregas y derechos de uso",
          title: en ? "Heads-up on your deals" : "Ojo con tus tratos",
          lines: items.map((i) => (en ? i.en : i.es)),
          button: { label: en ? "Open Brands" : "Abrir Marcas", url: `${origin}/admin/marcas` },
        });
        await sendEmail({ to: owner.email, ...mail });
        sent++;
      } catch (error) {
        console.error("No se pudo enviar el recordatorio de tratos", error);
      }
    }
  }

  // Se marcan como avisados aunque falle el correo de una cuenta: el aviso también se ve en el Resumen.
  await Promise.all([
    dueNow.length ? prismaRoot.deliverable.updateMany({ where: { id: { in: dueNow.map((d) => d.id) } }, data: { remindedAt: now } }) : null,
    rightsNow.length ? prismaRoot.brand.updateMany({ where: { id: { in: rightsNow.map((b) => b.id) } }, data: { usageReminderAt: now } }) : null,
  ]);
  return { emails: sent, deliverables: dueNow.length, rights: rightsNow.length };
}
