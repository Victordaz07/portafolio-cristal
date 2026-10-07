import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";
import { MAX_REPLY, hasContactInfo } from "@/lib/brand-reviews";

export const dynamic = "force-dynamic";

const schema = z.object({ brandKey: z.string().min(1).max(60), text: z.string().trim().max(MAX_REPLY) });

/** Derecho de respuesta: Comunidad agrega (o borra, con texto vacío) la respuesta de la marca. */
export async function PUT(request: Request) {
  const { t } = await getT();
  const user = await requireRole("community");
  if (!user) return NextResponse.json({ error: t("Solo el equipo de Comunidad", "Community team only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { brandKey, text } = parsed.data;
  if (!text) {
    await prismaRoot.brandReviewReply.deleteMany({ where: { brandKey } });
    return NextResponse.json({ ok: true });
  }
  if (hasContactInfo(text)) return NextResponse.json({ error: t("Quita correos, teléfonos y enlaces de la respuesta", "Remove emails, phone numbers and links from the reply") }, { status: 400 });
  const sample = await prismaRoot.brandReview.findFirst({ where: { brandKey }, select: { brandName: true } });
  if (!sample) return NextResponse.json({ error: t("No hay reseñas de esa marca", "There are no reviews for that brand") }, { status: 404 });
  await prismaRoot.brandReviewReply.upsert({
    where: { brandKey },
    create: { brandKey, brandName: sample.brandName, text, addedById: user.id },
    update: { text, addedById: user.id },
  });
  return NextResponse.json({ ok: true });
}
