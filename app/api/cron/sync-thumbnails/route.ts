import { NextResponse } from "next/server";
import { syncFeedThumbnailsForAllCreators } from "@/lib/social/metrics-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Tarea periódica (Vercel Cron, ver vercel.json): para cada cuenta, trae del Instagram/Facebook/TikTok
 * conectado las publicaciones recientes y rellena o renueva la miniatura de las tarjetas del Feed que
 * la tengan rota o vacía — sin que la creadora ni quien visita el sitio tengan que hacer nada.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await syncFeedThumbnailsForAllCreators();
  return NextResponse.json({ ok: true, ...result });
}
