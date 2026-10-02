import { NextResponse } from "next/server";
import { isPlatformId } from "@/lib/social/types";
import { testConnection } from "@/lib/social/accounts";

export const dynamic = "force-dynamic";

/** Prueba la conexión: renueva el token si hace falta y trae perfil + publicaciones recientes. */
export async function POST(_request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  if (!isPlatformId(platform)) {
    return NextResponse.json({ error: "Red desconocida" }, { status: 404 });
  }
  return NextResponse.json(await testConnection(platform));
}
