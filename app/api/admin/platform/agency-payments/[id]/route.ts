import { NextResponse } from "next/server";
import { z } from "zod";
import { platformAdminUser } from "@/lib/platform-admin";
import { confirmAgencyPayment, rejectAgencyPayment } from "@/lib/agency-billing-server";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["confirm", "reject"]) });

/** Confirmar o rechazar el pago que una agencia (plan Crew) reportó. Solo quien administra Foliocrew. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  if (parsed.data.action === "confirm") {
    const paidUntil = await confirmAgencyPayment(id, admin.email);
    if (!paidUntil) return NextResponse.json({ error: t("Ese pago no existe o ya estaba confirmado", "That payment doesn't exist or was already confirmed") }, { status: 400 });
    return NextResponse.json({ ok: true, paidUntil });
  }
  if (!(await rejectAgencyPayment(id, admin.email))) {
    return NextResponse.json({ error: t("Ese pago no está pendiente", "That payment isn't pending") }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
