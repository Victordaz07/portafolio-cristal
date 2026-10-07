import { NextResponse } from "next/server";
import { z } from "zod";
import { AiQuotaError, aiErrorMessage, isAiConfigured } from "@/lib/ai";
import { suggestRecycle } from "@/lib/ai-recycle";
import { RECYCLE_TONES, SOURCE_MAX, isUsableSource } from "@/lib/recycle";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  /** Texto pegado (transcripción, guion o publicación) */
  text: z.string().max(SOURCE_MAX * 2).optional(),
  /** O una publicación del Feed que funcionó */
  cardId: z.string().min(1).max(60).optional(),
  tone: z.enum(RECYCLE_TONES).default("cercano"),
  lang: z.enum(["es", "en"]).default("es"),
  goal: z.string().trim().max(200).optional(),
});

/** Reutiliza un contenido ya hecho: versiones por red, ganchos y un carrusel. No publica nada. */
export async function POST(request: Request) {
  const { t, lang } = await getT();
  if (!isAiConfigured()) {
    return NextResponse.json({ error: t("Falta ANTHROPIC_API_KEY (Conectar cuentas → IA)", "ANTHROPIC_API_KEY is missing (Connect accounts → AI)") }, { status: 400 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { text, cardId, tone, lang: outLang, goal } = parsed.data;
  let source = text ?? "";
  if (cardId) {
    const card = await prisma.contentCard.findUnique({ where: { id: cardId }, select: { caption: true, captionEn: true } });
    if (!card) return NextResponse.json({ error: t("No se encontró la publicación", "Post not found") }, { status: 404 });
    source = [source, card.caption, card.captionEn].filter(Boolean).join("\n\n");
  }
  if (!isUsableSource(source)) {
    return NextResponse.json({ error: t("Pega un texto más largo (al menos 40 caracteres) o elige una publicación", "Paste a longer text (at least 40 characters) or choose a post") }, { status: 400 });
  }
  try {
    return NextResponse.json(await suggestRecycle({ source, tone, lang: outLang, goal }));
  } catch (error) {
    return NextResponse.json({ error: aiErrorMessage(error, lang) }, { status: error instanceof AiQuotaError ? 429 : 502 });
  }
}
