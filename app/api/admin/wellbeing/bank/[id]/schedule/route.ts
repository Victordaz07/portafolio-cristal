import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { scheduleSchema } from "@/lib/wellbeing-schemas";
import { zonedToUtc } from "@/lib/content-plan";
import { appTimeZone } from "@/lib/growth-server";

export const dynamic = "force-dynamic";

/** Programa una idea del banco en el calendario (la idea se queda en el banco, marcada como usada). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = scheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Elige el día, la hora y al menos una red", "Choose the day, the time and at least one network") }, { status: 400 });
  const item = await prisma.contentBankItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: t("No se encontró la idea", "Idea not found") }, { status: 404 });
  const post = await prisma.scheduledPost.create({
    data: {
      caption: item.caption,
      topic: item.title,
      contentType: item.contentType,
      networks: parsed.data.networks,
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType,
      scheduledFor: zonedToUtc(parsed.data.date, parsed.data.time, appTimeZone()),
      status: "scheduled",
    },
  });
  await prisma.contentBankItem.update({ where: { id }, data: { usedAt: new Date() } });
  return NextResponse.json({ ok: true, postId: post.id }, { status: 201 });
}
