import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { getSession } from "@/lib/tenant";
import { todayKey } from "@/lib/growth-server";
import { restSchema } from "@/lib/wellbeing-schemas";
import { validateRest } from "@/lib/wellbeing";
import { applyRest, previewRest } from "@/lib/wellbeing-server";

export const dynamic = "force-dynamic";

/** Vista previa o activación del modo descanso. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (session?.actorId) return NextResponse.json({ error: t("El equipo no activa el descanso de una cuenta", "The team can't turn on an account's rest mode") }, { status: 403 });
  const parsed = restSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa las fechas del descanso", "Check the rest dates") }, { status: 400 });
  const { start, end, note, moveDeliverables, preview } = parsed.data;
  const check = validateRest(start, end, todayKey());
  if (!check.ok) {
    const errors = {
      dates: t("Fechas inválidas", "Invalid dates"),
      order: t("El final no puede ser antes del inicio", "The end can't be before the start"),
      past: t("El descanso debe empezar hoy o más adelante", "The break must start today or later"),
      long: t("El descanso puede durar hasta 60 días", "A break can last up to 60 days"),
    };
    return NextResponse.json({ error: errors[check.reason] }, { status: 400 });
  }
  if (preview) {
    const { plan, notices } = await previewRest(start, end, moveDeliverables);
    return NextResponse.json({ days: plan.days, posts: plan.posts.length, deliverables: plan.deliverables.length, affected: plan.affectedDeliverables.length, notices: notices.map((n) => ({ brandId: n.brandId, brandName: n.brandName, hasEmail: Boolean(n.email), titles: n.titles })) });
  }
  const result = await applyRest(start, end, note, moveDeliverables);
  return NextResponse.json({ ok: true, ...result, notices: undefined });
}
