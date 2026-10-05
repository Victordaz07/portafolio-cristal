import { NextResponse } from "next/server";
import { requireRole } from "@/lib/team";
import { logPlatformAction } from "@/lib/platform-admin";
import { exportCreatorData, exportFileName } from "@/lib/data-export";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** El equipo de Datos descarga la copia de una cuenta (queda registrado). */
export async function GET(_request: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { t } = await getT();
  const user = await requireRole("data");
  if (!user) return NextResponse.json({ error: t("Solo el equipo de Recuperación de datos", "Data recovery team only") }, { status: 403 });
  const { creatorId } = await params;
  const data = await exportCreatorData(creatorId, { forTeam: true });
  if (!data) return NextResponse.json({ error: t("No encontré esa cuenta", "Couldn't find that account") }, { status: 404 });
  await logPlatformAction(user.email, "data-export", creatorId, `Copia de ${data.creator.name}`);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(data.creator.slug)}"`,
      "Cache-Control": "no-store",
    },
  });
}
