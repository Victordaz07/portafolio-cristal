import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { canModerateCircle } from "@/lib/circles-server";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["hide", "show"]) });

/** Las moderadoras del círculo (o el equipo de Comunidad) ocultan o vuelven a mostrar un mensaje; la autora puede borrar el suyo. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { id } = await params;
  const message = await prismaRoot.circleMessage.findUnique({ where: { id }, select: { circleId: true, creatorId: true } });
  if (!message) return NextResponse.json({ error: t("No se encontró el mensaje", "Message not found") }, { status: 404 });
  const moderator = await canModerateCircle(message.circleId, session.creatorId);
  const own = message.creatorId === session.creatorId && !session.actorId;
  // La autora solo puede ocultar el suyo (borrarlo); mostrar de nuevo es de moderación.
  if (!moderator && !(own && parsed.data.action === "hide")) return NextResponse.json({ error: t("No tienes permiso", "You don't have permission") }, { status: 403 });
  await prismaRoot.circleMessage.update({ where: { id }, data: parsed.data.action === "hide" ? { hiddenAt: new Date(), hiddenBy: session.userId } : { hiddenAt: null, hiddenBy: null } });
  return NextResponse.json({ ok: true });
}
