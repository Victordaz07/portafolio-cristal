import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { LIMITS, isReportReason } from "@/lib/community";
import { afterReport, findTarget } from "@/lib/community-moderation";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  targetType: z.enum(["post", "reply", "profile", "message"]),
  targetId: z.string().min(1).max(40),
  reason: z.string().refine(isReportReason),
  detail: z.string().trim().max(1000).default(""),
});

/** Reportar una publicación, respuesta o perfil (una vez por persona y contenido). */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("El equipo no reporta en nombre de una cuenta", "The team doesn't report on behalf of an account") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Elige un motivo", "Choose a reason") }, { status: 400 });
  if (tooManyAttempts(`community-report:${session.creatorId}`, LIMITS.reportsPerHour, 60 * 60_000)) {
    return NextResponse.json({ error: t("Enviaste muchos reportes seguidos. Espera un rato.", "You sent many reports in a row. Wait a bit.") }, { status: 429 });
  }
  const { targetType, targetId, reason, detail } = parsed.data;
  const target = await findTarget(targetType, targetId);
  if (!target) return NextResponse.json({ error: t("Ya no está disponible", "No longer available") }, { status: 404 });
  if (target.creatorId === session.creatorId) return NextResponse.json({ error: t("No puedes reportar lo tuyo", "You can't report your own content") }, { status: 400 });
  if (targetType === "message") {
    // Un mensaje privado solo lo puede reportar quien lo recibió.
    const inConversation = await prismaRoot.communityMessage.count({
      where: { id: targetId, conversation: { OR: [{ aId: session.creatorId }, { bId: session.creatorId }] } },
    });
    if (!inConversation) return NextResponse.json({ error: t("Ya no está disponible", "No longer available") }, { status: 404 });
  }

  const already = await prismaRoot.communityReport.findUnique({
    where: { reporterId_targetType_targetId: { reporterId: session.creatorId, targetType, targetId } },
    select: { id: true },
  });
  if (already) return NextResponse.json({ ok: true, already: true });
  await prismaRoot.communityReport
    .create({ data: { reporterId: session.creatorId, targetType, targetId, reason, detail } })
    .catch(() => null); // doble clic: el único por persona y contenido ya lo cubre
  await afterReport(target, reason);
  return NextResponse.json({ ok: true });
}
