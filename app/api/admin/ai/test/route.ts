import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { AI_MODEL, aiErrorMessage, getAiClient, isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Prueba mínima de conexión con Claude: pide un caption corto de ejemplo. */
export async function POST() {
  if (!isAiConfigured()) {
    return NextResponse.json({ ok: false, error: "Falta ANTHROPIC_API_KEY en las variables de entorno" });
  }

  const started = Date.now();
  try {
    const response = await getAiClient().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      // Si un filtro de seguridad rechaza la petición, la API la reintenta sola con otro modelo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [
        {
          role: "user",
          content:
            "Escribe un caption de una sola línea, en español y con tono cercano, para un reel de rutina de skincare de una persona creadora de contenido UGC. Responde solo con el caption.",
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ ok: false, error: "Claude rechazó la petición de prueba" });
    }
    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return NextResponse.json({
      ok: true,
      model: response.model,
      sample: text,
      ms: Date.now() - started,
      usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: aiErrorMessage(error) });
  }
}
