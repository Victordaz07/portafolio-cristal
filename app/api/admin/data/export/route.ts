import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { exportCreatorData, exportFileName } from "@/lib/data-export";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** La cuenta descarga una copia de sus datos (JSON). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  // Quien "entra como" una cuenta para ayudar no se lleva sus datos: eso pasa por el centro de Datos.
  if (session.actorId) return NextResponse.json({ error: "Usa el centro de Datos del equipo" }, { status: 403 });
  if (tooManyAttempts(`export:${session.creatorId}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Ya descargaste varias copias. Espera un rato." }, { status: 429 });
  }
  const data = await exportCreatorData(session.creatorId);
  if (!data) return NextResponse.json({ error: "No encontré tu cuenta" }, { status: 404 });
  const creator = await prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { slug: true } });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(creator?.slug ?? "cuenta")}"`,
      "Cache-Control": "no-store",
    },
  });
}
