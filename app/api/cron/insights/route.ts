import { NextResponse } from "next/server";
import { refreshInsights } from "@/lib/insights";
import { syncFeedThumbnailsForAllCreators } from "@/lib/social/metrics-sync";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Tarea diaria (Vercel Cron, ver vercel.json): recalcula la inteligencia de Foliocrew por nicho y,
 * de paso, renueva las miniaturas de Instagram/Facebook que caducaron (lib/social/thumbnail.ts).
 * Va en la misma tarea para no sumar otro cron.
 */
export async function GET(request: Request) {
  const { t } = await getT();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  }
  const insights = await refreshInsights();
  const thumbnails = await syncFeedThumbnailsForAllCreators().catch((error: unknown) => ({
    error: error instanceof Error ? error.message : "Error desconocido",
  }));
  return NextResponse.json({ ok: true, ...insights, thumbnails });
}
