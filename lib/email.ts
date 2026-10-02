import { appendFile } from "node:fs/promises";

// Correos de Foliocrew con Resend (https://resend.com), por su API HTTP.
// - RESEND_API_KEY: sin ella no se envía nada (la app funciona igual; el correo solo se registra).
// - EMAIL_FROM: remitente, p. ej. "Foliocrew <hola@foliocrew.pro>" (el dominio tiene que estar
//   verificado en Resend). Sin él se usa onboarding@resend.dev, que solo entrega a tu propio correo.
// - EMAIL_REPLY_TO: adónde llegan las respuestas (opcional).
// - EMAIL_OUTBOX_FILE (solo desarrollo): si no hay RESEND_API_KEY, guarda cada correo en ese archivo
//   (una línea JSON por correo) para poder revisarlos en las pruebas.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export type EmailResult = { sent: true; id: string } | { sent: false; reason: "not_configured" | "error"; error?: string };

/** Modo de pruebas: sin RESEND_API_KEY y con EMAIL_OUTBOX_FILE, los correos se guardan en ese archivo. */
function outboxFile() {
  return process.env.NODE_ENV !== "production" ? process.env.EMAIL_OUTBOX_FILE : undefined;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || outboxFile());
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const outbox = outboxFile();
    if (outbox) {
      await appendFile(outbox, JSON.stringify({ ...message, at: new Date().toISOString() }) + "\n");
      return { sent: true, id: "outbox" };
    }
    console.info(`[correo sin enviar: falta RESEND_API_KEY] ${message.to} — ${message.subject}`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Foliocrew <onboarding@resend.dev>",
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo || process.env.EMAIL_REPLY_TO || undefined,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok || !body.id) {
      console.error("Resend rechazó el correo", response.status, body.message);
      return { sent: false, reason: "error", error: body.message ?? `HTTP ${response.status}` };
    }
    return { sent: true, id: body.id };
  } catch (error) {
    console.error("No se pudo enviar el correo", error);
    return { sent: false, reason: "error", error: error instanceof Error ? error.message : String(error) };
  }
}
