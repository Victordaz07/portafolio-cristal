import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole } from "@/lib/team";
import { logPlatformAction } from "@/lib/platform-admin";
import { getT } from "@/lib/admin-lang-server";
import { findTarget, notifyAuthor, setHidden } from "@/lib/community-moderation";

export const dynamic = "force-dynamic";

const schema = z.object({
  /** hide: ocultar el contenido · show: volver a mostrarlo · dismiss: el reporte no procede · mute: pausar a la cuenta N días */
  action: z.enum(["hide", "show", "dismiss", "mute"]),
  days: z.union([z.literal(1), z.literal(7), z.literal(30)]).optional(),
});

/** Resolver un reporte (todos los reportes abiertos del mismo contenido se resuelven juntos). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const user = await requireRole("community");
  if (!user) return NextResponse.json({ error: t("Solo el equipo de Comunidad", "Community team only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { action, days } = parsed.data;
  if (action === "mute" && !days) return NextResponse.json({ error: t("Elige por cuántos días", "Choose how many days") }, { status: 400 });

  const { id } = await params;
  const report = await prismaRoot.communityReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: t("No encontré ese reporte", "Couldn't find that report") }, { status: 404 });
  const target = await findTarget(report.targetType as "post" | "reply" | "profile", report.targetId);
  if (!target) {
    await prismaRoot.communityReport.updateMany({
      where: { targetType: report.targetType, targetId: report.targetId, status: "open" },
      data: { status: "dismissed", handledBy: user.email, resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true, gone: true });
  }

  if (action === "hide" || action === "show") await setHidden(target, action === "hide", user.email);
  if (action === "mute") {
    await prismaRoot.communityProfile.updateMany({
      where: { creatorId: target.creatorId },
      data: { mutedUntil: new Date(Date.now() + days! * 86_400_000) },
    });
  }
  if (action !== "show") {
    await prismaRoot.communityReport.updateMany({
      where: { targetType: report.targetType, targetId: report.targetId, status: "open" },
      data: { status: action === "dismiss" ? "dismissed" : "actioned", handledBy: user.email, resolvedAt: new Date() },
    });
  }
  // Si lo había ocultado el sistema (5 reportes) y el reporte no procede, vuelve a verse.
  if (action === "dismiss" && target.hidden && target.type !== "profile") {
    const by = target.type === "post"
      ? (await prismaRoot.communityPost.findUnique({ where: { id: target.id }, select: { hiddenBy: true } }))?.hiddenBy
      : (await prismaRoot.communityReply.findUnique({ where: { id: target.id }, select: { hiddenBy: true } }))?.hiddenBy;
    if (by === "auto") await setHidden(target, false, user.email);
  }

  const detail = { hide: "ocultó", show: "volvió a mostrar", dismiss: "descartó el reporte de", mute: `pausó ${days} día(s) por` }[action];
  await logPlatformAction(user.email, "community", target.creatorId, `${detail} ${target.type}: ${target.summary.slice(0, 120)}`);
  if (action === "hide") await notifyAuthor(target.creatorId, "hidden", { summary: target.summary });
  if (action === "mute") await notifyAuthor(target.creatorId, "muted", { summary: target.summary, days });
  return NextResponse.json({ ok: true });
}
