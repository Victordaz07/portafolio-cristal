import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { LIMITS } from "@/lib/community";
import { blockedIds, participation, profileByHandle } from "@/lib/community-server";
import { connectionBetween, notifyConnection } from "@/lib/community-connections";

export const dynamic = "force-dynamic";

const schema = z.object({
  handle: z.string().trim().min(1).max(80),
  note: z.string().trim().max(LIMITS.connectionNote).default(""),
});

/** Pedir conectar con alguien (si esa persona ya me lo había pedido, quedamos conectados). */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t(`La nota puede tener hasta ${LIMITS.connectionNote} caracteres`, `The note can be up to ${LIMITS.connectionNote} characters`) }, { status: 400 });
  }
  const found = await profileByHandle(parsed.data.handle);
  if (!found) return NextResponse.json({ error: t("No encontré esa cuenta en la comunidad", "Couldn't find that account in the community") }, { status: 404 });
  const otherId = found.creator.id;
  const me = session.creatorId;
  if (otherId === me) return NextResponse.json({ error: t("No puedes conectar contigo", "You can't connect with yourself") }, { status: 400 });
  if ((await blockedIds(me)).includes(otherId)) {
    return NextResponse.json({ error: t("No encontré esa cuenta en la comunidad", "Couldn't find that account in the community") }, { status: 404 });
  }

  const [mine, myCreator] = await Promise.all([
    prismaRoot.communityProfile.findUnique({ where: { creatorId: me }, select: { displayName: true } }),
    prismaRoot.creator.findUnique({ where: { id: me }, select: { slug: true } }),
  ]);
  const from = { fromName: mine?.displayName ?? "", fromHandle: myCreator?.slug ?? "" };

  const existing = await connectionBetween(me, otherId);
  if (existing?.status === "accepted") return NextResponse.json({ ok: true, state: "connected" });
  if (existing?.requesterId === me) return NextResponse.json({ ok: true, state: "outgoing" });
  if (existing) {
    // La otra persona ya me lo había pedido: aceptar.
    await prismaRoot.communityConnection.update({ where: { id: existing.id }, data: { status: "accepted", respondedAt: new Date() } });
    await notifyConnection("accepted", { toCreatorId: otherId, ...from });
    return NextResponse.json({ ok: true, state: "connected" });
  }

  const sentToday = await prismaRoot.communityConnection.count({
    where: { requesterId: me, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
  });
  if (sentToday >= LIMITS.connectionsPerDay) {
    return NextResponse.json({ error: t("Enviaste muchas solicitudes hoy. Vuelve a intentarlo mañana.", "You sent many requests today. Try again tomorrow.") }, { status: 429 });
  }
  const created = await prismaRoot.communityConnection
    .create({ data: { requesterId: me, addresseeId: otherId, note: parsed.data.note } })
    .catch(() => null); // doble clic: el único por par ya lo cubre
  if (created) await notifyConnection("request", { toCreatorId: otherId, note: parsed.data.note, ...from });
  return NextResponse.json({ ok: true, state: "outgoing" });
}
