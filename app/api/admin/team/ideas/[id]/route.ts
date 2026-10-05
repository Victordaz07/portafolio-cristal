import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { ideaStatus, isIdeaStatus } from "@/lib/ideas";
import { requireRole } from "@/lib/team";
import { sendEmail } from "@/lib/email";
import { noticeEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.string().refine(isIdeaStatus).optional(),
  teamReply: z.string().trim().max(2000).optional(),
  internalNote: z.string().trim().max(2000).optional(),
});

/** Actualizar una idea: estado, respuesta para la cuenta o nota interna. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("growth");
  if (!user) return NextResponse.json({ error: "Solo Mejora continua" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const before = await prismaRoot.idea.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "No encontré esa idea" }, { status: 404 });
  const { status, teamReply, internalNote } = parsed.data;
  const idea = await prismaRoot.idea.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(teamReply !== undefined ? { teamReply: teamReply || null } : {}),
      ...(internalNote !== undefined ? { internalNote: internalNote || null } : {}),
    },
  });

  // Si la idea vino de una cuenta y pasó a "Planeada" o "¡Ya está!", se le avisa.
  if (idea.creatorId && status && status !== before.status && (status === "planned" || status === "done")) {
    try {
      const origin = await platformOrigin();
      const mail = noticeEmail({
        origin,
        name: idea.authorName,
        subject: status === "done" ? `¡Tu idea ya está en Foliocrew!` : `Tu idea está en nuestros planes`,
        title: status === "done" ? "¡Tu idea ya está lista!" : "Tu idea está en nuestros planes",
        lines: [`Tu sugerencia «${idea.title}» ahora está: ${ideaStatus(status).label}.`],
        quote: idea.teamReply ?? undefined,
        button: { label: "Ver mis sugerencias", url: `${origin}/admin/ideas` },
        note: "Gracias por ayudarnos a mejorar Foliocrew. 💜",
      });
      await sendEmail({ to: idea.authorEmail, ...mail });
    } catch (error) {
      console.error("No se pudo avisar del cambio de la idea", error);
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("growth");
  if (!user) return NextResponse.json({ error: "Solo Mejora continua" }, { status: 403 });
  const { id } = await params;
  const deleted = await prismaRoot.idea.delete({ where: { id } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "No encontré esa idea" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
