import { NextResponse } from "next/server";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { prismaRoot } from "@/lib/prisma-root";
import { pushConfigured, sendPush } from "@/lib/push-server";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Manda un aviso de prueba a los dispositivos de esta cuenta. */
export async function POST() {
  const { t } = await getT();
  const session = await getSession();
  if (!session || session.actorId) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ error: t("Los avisos en el celular aún no están activos en Foliocrew", "Phone notices aren't active on Foliocrew yet") }, { status: 400 });
  if (tooManyAttempts(`push-test:${session.userId}`, 5, 10 * 60_000)) return NextResponse.json({ error: t("Demasiadas pruebas; espera unos minutos", "Too many tests; wait a few minutes") }, { status: 429 });
  const mine = await prismaRoot.pushSubscription.count({ where: { creatorId: session.creatorId, userId: session.userId } });
  if (!mine) return NextResponse.json({ error: t("Primero activa los avisos en este dispositivo", "First turn on notices on this device") }, { status: 400 });
  const result = await sendPush(session.creatorId, null, (lang) => (lang === "en" ? { title: "Test notice ✅", body: "Foliocrew notices work on this device.", url: "/admin/notificaciones", tag: "test" } : { title: "Aviso de prueba ✅", body: "Los avisos de Foliocrew funcionan en este dispositivo.", url: "/admin/notificaciones", tag: "test" }), { onlyUserId: session.userId });
  return NextResponse.json({ ok: true, ...result });
}
