import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlatformId } from "@/lib/social/types";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** Desconecta la red: borra los tokens guardados (no revoca el permiso en la red). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { t } = await getT();
  const { platform } = await params;
  if (!isPlatformId(platform)) {
    return NextResponse.json({ error: t("Red desconocida", "Unknown network") }, { status: 404 });
  }
  await prisma.socialAccount.deleteMany({ where: { platform } });
  return NextResponse.json({ ok: true });
}
