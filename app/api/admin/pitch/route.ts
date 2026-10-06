import { NextResponse } from "next/server";
import { z } from "zod";
import { AiQuotaError, aiErrorMessage, isAiConfigured } from "@/lib/ai";
import { PITCH_TONES, suggestPitch } from "@/lib/ai-pitch";
import { prisma } from "@/lib/prisma";
import { sessionCreatorSite } from "@/lib/site-url";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  brandId: z.string().min(1).optional(),
  brandName: z.string().trim().min(1).max(100),
  brandLink: z.string().trim().max(300).optional(),
  contactName: z.string().trim().max(100).optional(),
  offer: z.string().trim().min(3).max(1000),
  tone: z.enum(PITCH_TONES).default("cercano"),
  lang: z.enum(["es", "en"]).default("es"),
  /** null = propuesta nueva; 1 o 2 = seguimiento. */
  followUp: z.union([z.literal(1), z.literal(2)]).nullable().optional(),
});

/** Escribe una propuesta (o un seguimiento) a una marca con Claude. No envía nada: la persona lo manda desde su correo. */
export async function POST(request: Request) {
  const { t, lang } = await getT();
  if (!isAiConfigured()) {
    return NextResponse.json({ error: t("Falta ANTHROPIC_API_KEY (Conectar cuentas → IA)", "ANTHROPIC_API_KEY is missing (Connect accounts → AI)") }, { status: 400 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const input = parsed.data;
  if (input.brandId && !(await prisma.brand.findUnique({ where: { id: input.brandId }, select: { id: true } }))) {
    return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  }
  const site = await sessionCreatorSite();
  if (!site) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  try {
    const pitch = await suggestPitch({
      brandName: input.brandName,
      brandLink: input.brandLink,
      contactName: input.contactName,
      offer: input.offer,
      tone: input.tone,
      lang: input.lang,
      followUp: input.followUp ?? null,
      mediaKitUrl: `${site.url}/media-kit`,
    });
    return NextResponse.json(pitch);
  } catch (error) {
    return NextResponse.json({ error: aiErrorMessage(error, lang) }, { status: error instanceof AiQuotaError ? 429 : 502 });
  }
}
