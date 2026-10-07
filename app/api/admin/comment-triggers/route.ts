import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { MAX_TRIGGERS, validateRule } from "@/lib/comment-trigger";

export const dynamic = "force-dynamic";

const schema = z.object({
  mediaId: z.string().trim().min(1).max(80),
  mediaLabel: z.string().trim().max(120).default(""),
  keyword: z.string().trim().min(1).max(60),
  message: z.string().trim().min(1).max(2000),
});

/** Crea una regla: «si comentan esta palabra en esta publicación, mándales este mensaje». */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa la publicación, la palabra y el mensaje", "Check the post, the word and the message") }, { status: 400 });
  const rule = validateRule(parsed.data);
  if (!rule.ok) {
    const reasons = {
      media: t("Elige una publicación", "Choose a post"),
      keyword: t("La palabra necesita al menos 2 letras o números", "The word needs at least 2 letters or numbers"),
      message: t("El mensaje es obligatorio y no puede pasar de 900 caracteres", "The message is required and can't exceed 900 characters"),
    };
    return NextResponse.json({ error: reasons[rule.reason] }, { status: 400 });
  }
  if ((await prisma.commentTrigger.count()) >= MAX_TRIGGERS) {
    return NextResponse.json({ error: t(`Puedes tener hasta ${MAX_TRIGGERS} reglas`, `You can have up to ${MAX_TRIGGERS} rules`) }, { status: 400 });
  }
  const existing = await prisma.commentTrigger.findFirst({ where: { mediaId: parsed.data.mediaId, keyword: rule.keyword } });
  if (existing) return NextResponse.json({ error: t("Ya tienes esa palabra en esa publicación", "You already have that word on that post") }, { status: 409 });
  const created = await prisma.commentTrigger.create({ data: { mediaId: parsed.data.mediaId, mediaLabel: parsed.data.mediaLabel, keyword: rule.keyword, message: rule.message } });
  return NextResponse.json(created, { status: 201 });
}
