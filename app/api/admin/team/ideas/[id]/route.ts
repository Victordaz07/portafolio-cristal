import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { ideaStatus, isIdeaStatus } from "@/lib/ideas";
import { requireRole } from "@/lib/team";
import { sendEmail } from "@/lib/email";
import { noticeEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { getT } from "@/lib/admin-lang-server";
import { mailLangFor } from "@/lib/email-lang";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.string().refine(isIdeaStatus).optional(),
  teamReply: z.string().trim().max(2000).optional(),
  internalNote: z.string().trim().max(2000).optional(),
});

/** Actualizar una idea: estado, respuesta para la cuenta o nota interna. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const user = await requireRole("growth");
  if (!user) return NextResponse.json({ error: t("Solo el equipo del Centro de sugerencias", "Suggestions center team only") }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const before = await prismaRoot.idea.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: t("No encontré esa idea", "Couldn't find that idea") }, { status: 404 });
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
      const lang = await mailLangFor(idea.authorEmail);
      const en = lang === "en";
      const done = status === "done";
      const mail = noticeEmail({
        lang,
        origin,
        name: idea.authorName,
        subject: en ? (done ? "Your idea is live in Foliocrew!" : "Your idea is in our plans") : done ? `¡Tu idea ya está en Foliocrew!` : `Tu idea está en nuestros planes`,
        title: en ? (done ? "Your idea is ready!" : "Your idea is in our plans") : done ? "¡Tu idea ya está lista!" : "Tu idea está en nuestros planes",
        lines: [
          en
            ? `Your suggestion “${idea.title}” is now: ${ideaStatus(status).labelEn}.`
            : `Tu sugerencia «${idea.title}» ahora está: ${ideaStatus(status).label}.`,
        ],
        quote: idea.teamReply ?? undefined,
        button: { label: en ? "See my suggestions" : "Ver mis sugerencias", url: `${origin}/admin/ideas` },
        note: en ? "Thanks for helping us improve Foliocrew. 💜" : "Gracias por ayudarnos a mejorar Foliocrew. 💜",
      });
      await sendEmail({ to: idea.authorEmail, ...mail });
    } catch (error) {
      console.error("No se pudo avisar del cambio de la idea", error);
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const user = await requireRole("growth");
  if (!user) return NextResponse.json({ error: t("Solo el equipo del Centro de sugerencias", "Suggestions center team only") }, { status: 403 });
  const { id } = await params;
  const deleted = await prismaRoot.idea.delete({ where: { id } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: t("No encontré esa idea", "Couldn't find that idea") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
