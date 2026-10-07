import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { pushConfigured } from "@/lib/push-server";

export const dynamic = "force-dynamic";

/** ¿Están activos los avisos? Devuelve la llave pública y los dispositivos de esta persona. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const configured = pushConfigured();
  const devices = configured
    ? await prismaRoot.pushSubscription.findMany({ where: { creatorId: session.creatorId, userId: session.userId }, select: { endpoint: true, topics: true, userAgent: true, createdAt: true }, orderBy: { createdAt: "desc" } })
    : [];
  return NextResponse.json({ configured, publicKey: configured ? process.env.VAPID_PUBLIC_KEY : null, devices: devices.map((d) => ({ ...d, endpoint: d.endpoint })) });
}
