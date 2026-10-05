import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  deleteInstagramComment,
  hideInstagramComment,
  replyToInstagramComment,
} from "@/lib/social/instagram-comments";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), message: z.string().trim().min(1).max(2200) }),
  z.object({ action: z.literal("hide"), hide: z.boolean() }),
]);

function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Instagram rechazó la acción";
  return NextResponse.json({ error: message }, { status: 502 });
}

/** Responder u ocultar/mostrar un comentario. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  try {
    if (parsed.data.action === "reply") {
      const reply = await replyToInstagramComment(id, parsed.data.message);
      // Se guarda para reconocerla como propia: Meta no dice quién escribió cada respuesta.
      await prisma.inboxReply.create({ data: { id: reply.id, platform: "instagram", commentId: id } }).catch(() => null);
      return NextResponse.json({ ok: true, replyId: reply.id });
    }
    await hideInstagramComment(id, parsed.data.hide);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteInstagramComment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
