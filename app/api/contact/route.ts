import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, prismaRoot } from "@/lib/prisma";
import { currentCreatorId } from "@/lib/tenant";
import { sendEmail } from "@/lib/email";
import { brandMessageEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  collaborationType: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(request: Request) {
  const { t } = await getT();
  if (tooManyAttempts(`contact:${clientIp(request)}`, 5)) {
    return NextResponse.json({ error: t("Demasiados mensajes; prueba en un minuto", "Too many messages; try again in a minute") }, { status: 429 });
  }
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t("Revisa los campos del formulario", "Check the form fields") }, { status: 400 });
  }
  const data = parsed.data;

  // El mensaje se guarda siempre: aunque el correo falle, la persona lo ve en su Bandeja.
  const savedMessage = await prisma.contactMessage.create({ data });

  try {
    const creatorId = await currentCreatorId();
    const [settings, owner] = await Promise.all([
      prisma.siteSettings.findFirst({ select: { contactEmail: true } }),
      prismaRoot.adminUser.findFirst({ where: { creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true, language: true } }),
    ]);
    const to = settings?.contactEmail || owner?.email;
    if (to) {
      const origin = await platformOrigin();
      const mail = brandMessageEmail({
        lang: owner?.language === "en" ? "en" : "es",
        origin,
        creatorName: owner?.name ?? null,
        fromName: data.name,
        brand: data.brand,
        fromEmail: data.email,
        collaborationType: data.collaborationType,
        message: data.message,
        inboxUrl: `${origin}/admin/mensajes`,
      });
      await sendEmail({ to, ...mail, replyTo: data.email });
    }
  } catch (error) {
    console.error("No se pudo avisar por correo del mensaje de contacto", error);
  }

  return NextResponse.json({ ok: true, id: savedMessage.id });
}
