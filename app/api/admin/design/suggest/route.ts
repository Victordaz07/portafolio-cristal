import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { aiErrorMessage, isAiConfigured } from "@/lib/ai";
import { fallbackDesign, suggestDesign } from "@/lib/design-ai";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  bio: z.string().max(1000).optional(),
  attempt: z.number().int().min(0).max(50).default(0),
  current: z.record(z.string(), z.string()).optional(),
});

/** "Diséñalo por mí": propuesta de estilo, tipografía, color y portada según el nicho y la bio. */
export async function POST(request: Request) {
  const { t, lang } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const hero = await prisma.hero.findFirst({ select: { name: true, niche: true, description: true } });
  const niche = hero?.niche ?? "";
  if (!isAiConfigured()) {
    return NextResponse.json({ suggestion: fallbackDesign(niche, parsed.data.attempt, lang), source: "reglas" });
  }
  try {
    const suggestion = await suggestDesign({
      name: hero?.name ?? "",
      niche,
      bio: parsed.data.bio ?? hero?.description ?? "",
      current: parsed.data.current,
      lang,
    });
    return NextResponse.json({ suggestion, source: "claude" });
  } catch (error) {
    console.error("No se pudo proponer un diseño con IA", error);
    // Si Claude falla, igual damos una propuesta (y avisamos por qué).
    return NextResponse.json({ suggestion: fallbackDesign(niche, parsed.data.attempt, lang), source: "reglas", warning: aiErrorMessage(error, lang) });
  }
}
