import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ badge: z.boolean() });

/** La embajadora muestra u oculta la insignia «Foliocrew Ambassador» en su sitio público. */
export async function PATCH(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const result = await prismaRoot.creator.updateMany({
    where: { id: session.creatorId, ambassador: true },
    data: { ambassadorBadge: parsed.data.badge },
  });
  if (!result.count) return NextResponse.json({ error: t("Esta cuenta no es embajadora", "This account isn't an ambassador") }, { status: 403 });
  return NextResponse.json({ ok: true });
}
