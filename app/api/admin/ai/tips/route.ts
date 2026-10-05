import { NextResponse } from "next/server";
import { z } from "zod";
import { AiQuotaError, aiErrorMessage, isAiConfigured } from "@/lib/ai";
import { suggestNetworkTips } from "@/lib/ai-content";
import { CONTENT_TYPES, PLAN_NETWORKS } from "@/lib/content-plan";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  caption: z.string().trim().min(6).max(5000),
  contentType: z.enum(CONTENT_TYPES),
  networks: z.array(z.enum(PLAN_NETWORKS)).min(1).max(4),
});

/** Consejos de IA para ejecutar la publicación en cada red. */
export async function POST(request: Request) {
  const { t } = await getT();
  if (!isAiConfigured()) {
    return NextResponse.json({ error: t("Falta ANTHROPIC_API_KEY (Conectar cuentas → IA)", "ANTHROPIC_API_KEY is missing (Connect accounts → AI)") }, { status: 400 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe al menos 6 caracteres y elige una red", "Write at least 6 characters and choose a network") }, { status: 400 });
  try {
    return NextResponse.json({ tips: await suggestNetworkTips(parsed.data) });
  } catch (error) {
    return NextResponse.json({ error: aiErrorMessage(error) }, { status: error instanceof AiQuotaError ? 429 : 502 });
  }
}
