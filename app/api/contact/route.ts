import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  email: z.string().email(),
  collaborationType: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa los campos del formulario" }, { status: 400 });
  }

  const data = parsed.data;

  const savedMessage = await prisma.contactMessage.create({ data });

  // TODO: enviar notificación por correo con Resend una vez que exista RESEND_API_KEY.
  // El mensaje ya queda guardado en la base de datos aunque el envío de correo falle o
  // no esté configurado, para que Crislia lo vea en /admin igual.
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const settings = await prisma.siteSettings.findFirst();
      if (settings?.contactEmail) {
        await resend.emails.send({
          from: "Portafolio Crislia <onboarding@resend.dev>",
          to: settings.contactEmail,
          subject: `Nueva colaboración: ${data.brand} (${data.collaborationType})`,
          text: `${data.name} — ${data.email}\n\n${data.message}`,
        });
      }
    } catch (error) {
      console.error("No se pudo enviar el correo de contacto", error);
    }
  }

  return NextResponse.json({ ok: true, id: savedMessage.id });
}
