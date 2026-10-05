import { NextResponse } from "next/server";
import { z } from "zod";
import { AiQuotaError, aiErrorMessage, isAiConfigured } from "@/lib/ai";
import { suggestCaptions } from "@/lib/ai-content";
import { CONTENT_TYPES, PLAN_NETWORKS } from "@/lib/content-plan";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  topic: z.string().trim().max(300).default(""),
  contentType: z.enum(CONTENT_TYPES),
  networks: z.array(z.enum(PLAN_NETWORKS)).max(4),
  brandName: z.string().trim().max(100).nullable().optional(),
  draft: z.string().max(3000).optional(),
});

/** Sugerencias de caption con Claude. */
export async function POST(request: Request) {
  const { t, lang } = await getT();
  if (!isAiConfigured()) {
    return NextResponse.json({ error: t("Falta ANTHROPIC_API_KEY (Conectar cuentas → IA)", "ANTHROPIC_API_KEY is missing (Connect accounts → AI)") }, { status: 400 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  try {
    return NextResponse.json({ captions: await suggestCaptions({ ...parsed.data, lang }) });
  } catch (error) {
    return NextResponse.json({ error: aiErrorMessage(error, lang) }, { status: error instanceof AiQuotaError ? 429 : 502 });
  }
}
