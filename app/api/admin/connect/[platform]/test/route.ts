import { NextResponse } from "next/server";
import { isPlatformId } from "@/lib/social/types";
import { testConnection } from "@/lib/social/accounts";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** Prueba la conexión: renueva el token si hace falta y trae perfil + publicaciones recientes. */
export async function POST(_request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { t } = await getT();
  const { platform } = await params;
  if (!isPlatformId(platform)) {
    return NextResponse.json({ error: t("Red desconocida", "Unknown network") }, { status: 404 });
  }
  return NextResponse.json(await testConnection(platform));
}
