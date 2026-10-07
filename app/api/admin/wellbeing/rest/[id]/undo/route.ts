import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { undoRest } from "@/lib/wellbeing-server";

export const dynamic = "force-dynamic";

/** Deshace un descanso: lo movido vuelve a su fecha (salvo lo que ya cambiaste a mano). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const result = await undoRest(id);
  if (!result) return NextResponse.json({ error: t("No se encontró el descanso o ya se deshizo", "Couldn't find the break or it was already undone") }, { status: 404 });
  return NextResponse.json({ ok: true, ...result });
}
