import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { MAX_DEVICES, cleanTopics, isAllowedEndpoint, subscriptionSchema } from "@/lib/push";
import { pushConfigured } from "@/lib/push-server";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function sessionOrError() {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 }), t };
  // Quien entra «como» otra cuenta no puede suscribir su propio dispositivo a los avisos de esa cuenta.
  if (session.actorId) return { error: NextResponse.json({ error: t("El equipo no activa avisos en nombre de una cuenta", "The team can't turn on notices on behalf of an account") }, { status: 403 }), t };
  if (!pushConfigured()) return { error: NextResponse.json({ error: t("Los avisos en el celular aún no están activos en Foliocrew", "Phone notices aren't active on Foliocrew yet") }, { status: 400 }), t };
  return { session, t };
}

/** Guarda este dispositivo (o cambia sus temas). */
export async function POST(request: Request) {
  const ctx = await sessionOrError();
  if ("error" in ctx) return ctx.error;
  const { session, t } = ctx;
  if (tooManyAttempts(`push-sub:${clientIp(request)}`, 10)) return NextResponse.json({ error: t("Demasiados intentos; prueba en un minuto", "Too many attempts; try again in a minute") }, { status: 429 });
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isAllowedEndpoint(parsed.data.endpoint)) return NextResponse.json({ error: t("Este dispositivo no se puede suscribir", "This device can't be subscribed") }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  const topics = cleanTopics(parsed.data.topics);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 200);
  // Si el dispositivo ya estaba con otra cuenta, pasa a esta (una sola cuenta por dispositivo y navegador).
  await prismaRoot.pushSubscription.upsert({
    where: { endpoint },
    create: { creatorId: session.creatorId, userId: session.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, topics, userAgent },
    update: { creatorId: session.creatorId, userId: session.userId, p256dh: keys.p256dh, auth: keys.auth, topics, userAgent },
  });
  // Máximo de dispositivos por persona: se borran los más viejos.
  const mine = await prismaRoot.pushSubscription.findMany({ where: { creatorId: session.creatorId, userId: session.userId }, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (mine.length > MAX_DEVICES) await prismaRoot.pushSubscription.deleteMany({ where: { id: { in: mine.slice(MAX_DEVICES).map((m) => m.id) } } });
  return NextResponse.json({ ok: true, topics });
}

const topicsSchema = z.object({ endpoint: z.string().url().max(1000), topics: z.array(z.string()).max(10) });

/** Cambia qué avisos recibe este dispositivo. */
export async function PATCH(request: Request) {
  const ctx = await sessionOrError();
  if ("error" in ctx) return ctx.error;
  const { session, t } = ctx;
  const parsed = topicsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const result = await prismaRoot.pushSubscription.updateMany({ where: { endpoint: parsed.data.endpoint, creatorId: session.creatorId, userId: session.userId }, data: { topics: cleanTopics(parsed.data.topics) } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró este dispositivo", "Device not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** Quita este dispositivo. */
export async function DELETE(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const parsed = z.object({ endpoint: z.string().url().max(1000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  await prismaRoot.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, creatorId: session.creatorId, userId: session.userId } });
  return NextResponse.json({ ok: true });
}
