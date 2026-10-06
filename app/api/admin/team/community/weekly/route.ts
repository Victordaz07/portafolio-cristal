import { NextResponse } from "next/server";
import { requireRole } from "@/lib/team";
import { logPlatformAction } from "@/lib/platform-admin";
import { getT } from "@/lib/admin-lang-server";
import { publishWeeklyQuestion } from "@/lib/community-weekly";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** El equipo de Comunidad publica la pregunta de la semana ahora (reemplaza la fijada). */
export async function POST() {
  const { t } = await getT();
  const user = await requireRole("community");
  if (!user) return NextResponse.json({ error: t("Solo el equipo de Comunidad", "Community team only") }, { status: 403 });
  if (tooManyAttempts(`community-weekly:${user.email}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: t("Ya generaste varias. Espera un rato.", "You already generated several. Wait a bit.") }, { status: 429 });
  }
  const result = await publishWeeklyQuestion({ force: true });
  if (!("id" in result)) return NextResponse.json({ error: t("Falta configurar la cuenta del equipo (PLATFORM_ADMIN_EMAILS)", "The team account isn't set up (PLATFORM_ADMIN_EMAILS)") }, { status: 400 });
  await logPlatformAction(user.email, "community", null, "publicó la pregunta de la semana");
  return NextResponse.json({ ok: true, id: result.id });
}
