import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.union([z.object({ badge: z.boolean() }), z.object({ listed: z.boolean() })]);

/** La embajadora muestra u oculta su insignia «Foliocrew Ambassador», o decide si aparece en la sección «Embajadoras» de Foliocrew. */
export async function PATCH(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const result = await prismaRoot.creator.updateMany({
    where: { id: session.creatorId, ambassador: true },
    data: "badge" in parsed.data ? { ambassadorBadge: parsed.data.badge } : { ambassadorPublic: parsed.data.listed },
  });
  if (!result.count) return NextResponse.json({ error: t("Esta cuenta no es embajadora", "This account isn't an ambassador") }, { status: 403 });
  return NextResponse.json({ ok: true });
}
