import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { exportCreatorData, exportFileName } from "@/lib/data-export";
import { tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** La cuenta descarga una copia de sus datos (JSON). */
export async function GET() {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  // Quien "entra como" una cuenta para ayudar no se lleva sus datos: eso pasa por el centro de Datos.
  if (session.actorId) return NextResponse.json({ error: t("Usa el centro de Datos del equipo", "Use the team's Data center") }, { status: 403 });
  if (tooManyAttempts(`export:${session.creatorId}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: t("Ya descargaste varias copias. Espera un rato.", "You already downloaded several copies. Wait a bit.") }, { status: 429 });
  }
  const data = await exportCreatorData(session.creatorId);
  if (!data) return NextResponse.json({ error: t("No encontré tu cuenta", "Couldn't find your account") }, { status: 404 });
  const creator = await prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { slug: true } });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(creator?.slug ?? "cuenta")}"`,
      "Cache-Control": "no-store",
    },
  });
}
