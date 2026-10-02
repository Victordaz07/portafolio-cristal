import { NextResponse } from "next/server";
import { syncFeedMetrics } from "@/lib/social/metrics-sync";

export const dynamic = "force-dynamic";

/** Trae las métricas de Instagram y TikTok conectados y las copia a las tarjetas del Feed. */
export async function POST() {
  return NextResponse.json(await syncFeedMetrics());
}
