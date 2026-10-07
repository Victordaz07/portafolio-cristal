import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { publishDuePosts } from "@/lib/publish-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Publica lo programado que ya llegó a su hora. Vercel Hobby solo deja 2 tareas diarias (y ya están usadas),
 * así que esta ruta se puede llamar cada pocos minutos desde cualquier programador externo gratuito
 * con `Authorization: Bearer <CRON_SECRET>`; además la tarea diaria de facturación la llama como red de seguridad.
 */
export async function GET(request: Request) {
  const { t } = await getT();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await publishDuePosts()) });
}
