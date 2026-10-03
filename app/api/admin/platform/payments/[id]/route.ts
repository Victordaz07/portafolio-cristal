import { NextResponse } from "next/server";
import { z } from "zod";
import { platformAdminUser } from "@/lib/platform-admin";
import { confirmPayment, rejectPayment } from "@/lib/billing-server";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["confirm", "reject"]) });

/** Confirmar (activa el plan) o rechazar un pago que la persona reportó. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: "Solo para quien administra Foliocrew" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  if (parsed.data.action === "confirm") {
    const paidUntil = await confirmPayment(id, admin.email);
    if (!paidUntil) return NextResponse.json({ error: "Ese pago no existe o ya estaba confirmado" }, { status: 400 });
    return NextResponse.json({ ok: true, paidUntil });
  }
  if (!(await rejectPayment(id, admin.email))) {
    return NextResponse.json({ error: "Ese pago no está pendiente" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
