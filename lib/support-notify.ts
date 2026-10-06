import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { platformOrigin } from "./site-url";
import { teamEmailsWith } from "./team";
import { mailLangFor } from "./email-lang";

// Correos del centro de soporte. Nunca rompen la acción: si falla el envío, solo se registra.

type TicketInfo = { id: string; number: number; subject: string; authorEmail: string; authorName: string | null; assignedTo: string | null };

/** Aviso al equipo: ticket nuevo o respuesta de la cuenta (a quien lo atiende, o a todo Soporte). */
export async function notifyTeamOfTicket(ticket: TicketInfo, kind: "new" | "reply", accountName: string, message: string) {
  try {
    const origin = await platformOrigin();
    const recipients = ticket.assignedTo ? [ticket.assignedTo] : await teamEmailsWith("support");
    await Promise.all(
      recipients.map(async (to) => {
        const lang = await mailLangFor(to);
        const en = lang === "en";
        const isNew = kind === "new";
        const mail = noticeEmail({
          lang,
          origin,
          subject: isNew
            ? `Ticket #${ticket.number}: ${ticket.subject}`
            : en ? `Reply on ticket #${ticket.number}` : `Respuesta en el ticket #${ticket.number}`,
          title: en ? (isNew ? "New support ticket" : "The account replied") : isNew ? "Nuevo ticket de soporte" : "La cuenta respondió",
          lines: [
            en
              ? `${accountName} (${ticket.authorEmail}) ${isNew ? "opened ticket" : "replied on ticket"} #${ticket.number}: “${ticket.subject}”.`
              : `${accountName} (${ticket.authorEmail}) ${isNew ? "abrió un ticket" : "respondió en el ticket"} #${ticket.number}: «${ticket.subject}».`,
          ],
          quote: message,
          button: { label: en ? "Open the ticket" : "Abrir el ticket", url: `${origin}/admin/equipo/soporte/${ticket.id}` },
        });
        return sendEmail({ to, ...mail, replyTo: ticket.authorEmail });
      })
    );
  } catch (error) {
    console.error("No se pudo avisar al equipo del ticket", error);
  }
}

/** Aviso a la cuenta: el equipo respondió su ticket. */
export async function notifyCustomerOfReply(ticket: TicketInfo, teamName: string, message: string) {
  try {
    const origin = await platformOrigin();
    const lang = await mailLangFor(ticket.authorEmail);
    const en = lang === "en";
    const mail = noticeEmail({
      lang,
      origin,
      name: ticket.authorName,
      subject: en ? `Reply to your ticket #${ticket.number}: ${ticket.subject}` : `Respuesta a tu ticket #${ticket.number}: ${ticket.subject}`,
      title: en ? "We replied" : "Te respondimos",
      lines: [
        en
          ? `${teamName}, from the Foliocrew team, replied to your ticket #${ticket.number}.`
          : `${teamName}, del equipo de Foliocrew, respondió tu ticket #${ticket.number}.`,
      ],
      quote: message,
      button: { label: en ? "View and reply" : "Ver y responder", url: `${origin}/admin/soporte/${ticket.id}` },
      note: en ? "To keep everything in one place, reply from your dashboard." : "Para que todo quede en un solo lugar, responde desde tu panel.",
    });
    await sendEmail({ to: ticket.authorEmail, ...mail });
  } catch (error) {
    console.error("No se pudo avisar a la cuenta de la respuesta", error);
  }
}
