import { NextResponse } from "next/server";
import { platformAdminUser, logPlatformAction } from "@/lib/platform-admin";
import { refreshInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Recalcular ya la inteligencia de Foliocrew (además del cálculo diario). */
export async function POST() {
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: "Solo para quien administra Foliocrew" }, { status: 403 });
  const result = await refreshInsights();
  await logPlatformAction(admin.email, "insights", null, `${result.updated.length} grupos · ${result.posts} publicaciones`);
  return NextResponse.json({ ok: true, ...result });
}
