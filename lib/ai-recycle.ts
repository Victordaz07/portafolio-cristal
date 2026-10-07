import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AI_MODEL, AiRefusalError, assertAiQuota, getAiClient, getCreatorContext, recordAiUsage } from "@/lib/ai";
import { cleanSource, shapeResult, type RecycleResult, type RecycleTone } from "@/lib/recycle";

// Reciclaje de contenido con IA (E4): de un texto largo (transcripción, guion o una publicación que funcionó)
// salen versiones para cada red, ganchos y un carrusel. Solo texto: Foliocrew no publica nada por su cuenta.

const SYSTEM = `Eres asistente de una persona creadora de contenido que reutiliza algo que ya hizo (una transcripción, un guion o una publicación que funcionó) para otras redes.
Mantén la voz y las ideas del texto original: reformula, no inventes. REGLAS: no añadas datos, cifras, resultados, productos, marcas ni promesas que no estén en el texto original.
Si el contenido parece patrocinado, no afirmes ni niegues que lo sea; la persona añadirá el aviso de publicidad. No uses clickbait engañoso: los ganchos deben cumplirse con lo que dice el texto.`;

// Si un filtro de seguridad rechaza la petición, la API la reintenta sola con otro modelo.
const SAFETY = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const Schema = z.object({
  hooks: z.array(z.string()).describe("5 ganchos distintos para abrir un video o publicación, de máximo 140 caracteres, sacados de las ideas del texto"),
  instagram: z.object({
    caption: z.string().describe("Texto para Instagram: gancho en la primera línea, desarrollo breve y una pregunta o invitación al final; máximo 1500 caracteres, sin hashtags dentro"),
    hashtags: z.array(z.string()).describe("3 a 5 hashtags relevantes, sin el símbolo #"),
  }),
  tiktok: z.object({
    caption: z.string().describe("Texto corto para TikTok (máximo 150 caracteres)"),
    onScreenText: z.string().describe("Texto para poner en pantalla en los primeros 2 segundos (máximo 80 caracteres)"),
  }),
  youtube: z.object({
    title: z.string().describe("Título de YouTube, máximo 70 caracteres, claro y honesto"),
    description: z.string().describe("Descripción de YouTube de 2 o 3 párrafos cortos, sin hashtags de relleno"),
  }),
  facebook: z.object({ post: z.string().describe("Publicación para una página de Facebook, conversacional, máximo 700 caracteres") }),
  carousel: z.object({
    slides: z.array(z.object({ title: z.string().describe("Título de la diapositiva, máximo 40 caracteres"), text: z.string().describe("Texto de la diapositiva, máximo 150 caracteres") })).describe("Entre 5 y 7 diapositivas: portada, 3 a 5 ideas y un cierre con invitación"),
  }),
});

export interface RecycleInput {
  source: string;
  tone: RecycleTone;
  lang: "es" | "en";
  /** Para qué se quiere (opcional): "conseguir seguidores", "vender mi guía"… */
  goal?: string;
}

const TONE_NOTE: Record<RecycleTone, string> = {
  cercano: "Tono cercano y cálido.",
  profesional: "Tono profesional y claro.",
  directo: "Tono directo: frases cortas y al grano.",
};

export async function suggestRecycle(input: RecycleInput): Promise<RecycleResult> {
  await assertAiQuota();
  const context = await getCreatorContext();
  const language = input.lang === "en" ? "Write everything in natural US English, even if the original text is in Spanish." : "Escribe todo en español neutro latino (mantén el idioma original del texto si ya es español).";
  const prompt = `${context}

Texto original que se va a reciclar (puede ser una transcripción, un guion o el texto de una publicación):
"""
${cleanSource(input.source)}
"""
${input.goal ? `Objetivo de la persona: ${input.goal}\n` : ""}${TONE_NOTE[input.tone]}
Crea las versiones para cada red a partir de las ideas de este texto.
${language}`;
  const response = await getAiClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 6000,
    output_config: { effort: "low", format: betaZodOutputFormat(Schema) },
    ...SAFETY,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  await recordAiUsage("recycle", response.usage);
  if (response.stop_reason === "refusal") throw new AiRefusalError();
  const out = response.parsed_output;
  if (!out) throw new AiRefusalError();
  return shapeResult(out);
}
