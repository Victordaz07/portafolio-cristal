import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole } from "@/lib/team";
import { logPlatformAction } from "@/lib/platform-admin";
import { dataRequestKindLabel } from "@/lib/data-export";
import { sendEmail } from "@/lib/email";
import { noticeEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["open", "done", "rejected"]),
  resolution: z.string().trim().max(2000).default(""),
});

/** El equipo de Datos resuelve (o rechaza) un pedido y se le avisa a la cuenta. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("data");
  if (!user) return NextResponse.json({ error: "Solo Datos y recuperación" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { status, resolution } = parsed.data;
  if (status !== "open" && resolution.length < 3) {
    return NextResponse.json({ error: "Escribe qué se hizo, para avisarle a la cuenta" }, { status: 400 });
  }
  const before = await prismaRoot.dataRequest.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "No encontré ese pedido" }, { status: 404 });
  const updated = await prismaRoot.dataRequest.update({
    where: { id },
    data:
      status === "open"
        ? { status, handledBy: null, resolvedAt: null }
        : { status, resolution, handledBy: user.email, resolvedAt: new Date() },
  });
  await logPlatformAction(user.email, "data-request", updated.creatorId, `${dataRequestKindLabel(updated.kind)} → ${status}`);

  if (status !== "open" && before.status === "open") {
    try {
      const origin = await platformOrigin();
      const mail = noticeEmail({
        origin,
        subject: status === "done" ? `Listo: ${dataRequestKindLabel(updated.kind)}` : `Sobre tu pedido: ${dataRequestKindLabel(updated.kind)}`,
        title: status === "done" ? "Tu pedido está resuelto" : "No pudimos completar tu pedido",
        lines: [`Revisamos tu pedido «${dataRequestKindLabel(updated.kind)}».`],
        quote: resolution,
        button: { label: "Ver en Mi cuenta", url: `${origin}/admin/cuenta#datos` },
        note: "Si algo no quedó bien, respóndenos desde Soporte en tu panel.",
      });
      await sendEmail({ to: updated.requestedBy, ...mail });
    } catch (error) {
      console.error("No se pudo avisar del pedido de datos", error);
    }
  }
  return NextResponse.json({ ok: true });
}
