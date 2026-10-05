import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { platformOrigin } from "./site-url";
import { teamEmailsWith } from "./team";

// Correos del centro de soporte. Nunca rompen la acción: si falla el envío, solo se registra.

type TicketInfo = { id: string; number: number; subject: string; authorEmail: string; authorName: string | null; assignedTo: string | null };

/** Aviso al equipo: ticket nuevo o respuesta de la cuenta (a quien lo atiende, o a todo Soporte). */
export async function notifyTeamOfTicket(ticket: TicketInfo, kind: "new" | "reply", accountName: string, message: string) {
  try {
    const origin = await platformOrigin();
    const recipients = ticket.assignedTo ? [ticket.assignedTo] : await teamEmailsWith("support");
    const mail = noticeEmail({
      origin,
      subject: kind === "new" ? `Ticket #${ticket.number}: ${ticket.subject}` : `Respuesta en el ticket #${ticket.number}`,
      title: kind === "new" ? "Nuevo ticket de soporte" : "La cuenta respondió",
      lines: [`${accountName} (${ticket.authorEmail}) ${kind === "new" ? "abrió un ticket" : "respondió en el ticket"} #${ticket.number}: «${ticket.subject}».`],
      quote: message,
      button: { label: "Abrir el ticket", url: `${origin}/admin/equipo/soporte/${ticket.id}` },
    });
    await Promise.all(recipients.map((to) => sendEmail({ to, ...mail, replyTo: ticket.authorEmail })));
  } catch (error) {
    console.error("No se pudo avisar al equipo del ticket", error);
  }
}

/** Aviso a la cuenta: el equipo respondió su ticket. */
export async function notifyCustomerOfReply(ticket: TicketInfo, teamName: string, message: string) {
  try {
    const origin = await platformOrigin();
    const mail = noticeEmail({
      origin,
      name: ticket.authorName,
      subject: `Respuesta a tu ticket #${ticket.number}: ${ticket.subject}`,
      title: "Te respondimos",
      lines: [`${teamName}, del equipo de Foliocrew, respondió tu ticket #${ticket.number}.`],
      quote: message,
      button: { label: "Ver y responder", url: `${origin}/admin/soporte/${ticket.id}` },
      note: "Para que todo quede en un solo lugar, responde desde tu panel.",
    });
    await sendEmail({ to: ticket.authorEmail, ...mail });
  } catch (error) {
    console.error("No se pudo avisar a la cuenta de la respuesta", error);
  }
}
