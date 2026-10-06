import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ share: z.boolean() });

/** Sumarse (o salir) de la inteligencia de Foliocrew: resultados anónimos a cambio de comparativas del nicho. */
export async function PATCH(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("Esta decisión la toma la persona dueña de la cuenta", "Only the account owner can make this decision") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  await prismaRoot.creator.update({
    where: { id: session.creatorId },
    data: { shareInsights: parsed.data.share, shareInsightsAt: parsed.data.share ? new Date() : null },
  });
  return NextResponse.json({ ok: true });
}
