import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaRoot } from "@/lib/prisma-root";
import { getT } from "@/lib/admin-lang-server";
import { currentCreatorId, getSession } from "@/lib/tenant";
import { noticeSchema } from "@/lib/wellbeing-schemas";
import { sendEmail } from "@/lib/email";
import { noticeEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface StoredBrand {
  brandId: string;
  brandName: string;
  email: string | null;
  titles: string[];
  sentAt: string | null;
}

/** Envía a una marca el aviso del descanso, con el texto que la persona revisó y editó. Una vez por marca. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (session?.actorId) return NextResponse.json({ error: t("El equipo no envía avisos en nombre de una cuenta", "The team doesn't send notices on behalf of an account") }, { status: 403 });
  if (tooManyAttempts(`rest-notice:${clientIp(request)}`, 10)) return NextResponse.json({ error: t("Demasiados envíos; prueba en un minuto", "Too many sends; try again in a minute") }, { status: 429 });
  const { id } = await params;
  const parsed = noticeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe el mensaje (entre 10 y 2000 caracteres)", "Write the message (between 10 and 2000 characters)") }, { status: 400 });
  const period = await prisma.restPeriod.findUnique({ where: { id } });
  if (!period) return NextResponse.json({ error: t("No se encontró el descanso", "Break not found") }, { status: 404 });
  const brands = (Array.isArray(period.brands) ? period.brands : []) as unknown as StoredBrand[];
  const entry = brands.find((b) => b.brandId === parsed.data.brandId);
  if (!entry?.email) return NextResponse.json({ error: t("Esa marca no tiene correo de contacto", "That brand has no contact email") }, { status: 400 });
  if (entry.sentAt) return NextResponse.json({ error: t("Ya le avisaste a esta marca", "You already notified this brand") }, { status: 409 });

  const creatorId = await currentCreatorId();
  const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } });
  const hero = await prisma.hero.findFirst({ select: { name: true } });
  const from = hero?.name || owner?.name || "Foliocrew";
  const origin = await platformOrigin();
  const lines = parsed.data.message.split(/\n{2,}/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  const mail = noticeEmail({
    origin,
    name: null,
    subject: `${from}: aviso sobre sus entregas`,
    title: `${from}: aviso sobre sus entregas`,
    lines,
    button: { label: "Responder a " + from, url: `mailto:${owner?.email ?? ""}` },
  });
  const sent = await sendEmail({ to: entry.email, ...mail, replyTo: owner?.email });
  if (!("sent" in sent) || sent.sent === false) return NextResponse.json({ error: t("No se pudo enviar el correo; inténtalo más tarde", "Couldn't send the email; try again later") }, { status: 502 });
  const updated = brands.map((b) => (b.brandId === entry.brandId ? { ...b, sentAt: new Date().toISOString() } : b));
  await prisma.restPeriod.update({ where: { id }, data: { brands: updated as object[] } });
  return NextResponse.json({ ok: true });
}
