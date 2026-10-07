import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { validUnsubscribeToken } from "@/lib/waitlist-unsubscribe";
import { escapeHtml } from "@/lib/email-templates";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Baja de los correos de la lista de espera. El enlace de cada correo llega aquí:
// - GET: la persona tocó "Darme de baja" → se da de baja y ve una confirmación.
// - POST: el botón "Cancelar suscripción" del propio Gmail/Outlook (RFC 8058, un clic).

function page(lang: string, title: string, message: string, status = 200) {
  const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} · Foliocrew</title></head>
<body style="margin:0;background:#FBF7F5;font-family:Helvetica,Arial,sans-serif;color:#251023;">
<main style="max-width:480px;margin:0 auto;padding:64px 20px;">
  <img src="/brand/logo.png" alt="Foliocrew" width="150" style="display:block;height:auto;margin:0 0 24px;">
  <div style="background:#fff;border:1px solid #EADFE6;border-radius:20px;padding:32px 28px;">
    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-style:italic;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
    <p style="margin:0;font-size:16px;line-height:1.55;">${escapeHtml(message)}</p>
  </div>
</main>
</body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function unsubscribe(request: Request) {
  if (tooManyAttempts(`waitlist-unsub:${clientIp(request)}`, 30)) return { ok: false as const, status: 429 };
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  const token = url.searchParams.get("t") || "";
  if (!id || !token || !validUnsubscribeToken(id, token)) return { ok: false as const, status: 400 };
  const entry = await prismaRoot.waitlistEntry.findUnique({ where: { id }, select: { id: true, language: true, unsubscribedAt: true } });
  // Si la entrada ya no existe (se borraron sus datos), no queda nada por hacer: cuenta como baja hecha.
  if (entry && !entry.unsubscribedAt) {
    await prismaRoot.waitlistEntry.update({ where: { id }, data: { unsubscribedAt: new Date() } });
  }
  return { ok: true as const, lang: entry?.language === "en" ? "en" : "es" };
}

export async function GET(request: Request) {
  const result = await unsubscribe(request);
  if (!result.ok) {
    return page(
      "es",
      "No pudimos procesar el enlace",
      "El enlace no es válido o está incompleto. Responde al correo que recibiste y te damos de baja a mano. / This link isn't valid. Reply to the email you received and we'll unsubscribe you manually.",
      result.status
    );
  }
  return result.lang === "en"
    ? page("en", "You're unsubscribed", "You won't get any more emails from the Foliocrew waitlist. If you change your mind, you can sign up again on our site.")
    : page("es", "Ya te dimos de baja", "No vas a recibir más correos de la lista de espera de Foliocrew. Si cambias de idea, puedes volver a anotarte en nuestra página.");
}

export async function POST(request: Request) {
  const result = await unsubscribe(request);
  return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false }, { status: result.status });
}
