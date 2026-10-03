import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AI_MODEL, getAiClient, getCreatorContext, recordAiUsage } from "@/lib/ai";
import { CONTENT_TYPE_LABEL, NETWORK_META, type ContentType, type PlanNetwork } from "@/lib/content-plan";

const SYSTEM = `Eres asistente de una persona creadora de contenido que trabaja con marcas (el contexto dice si publica en sus redes, hace UGC o ambas cosas).
Escribes en español neutro latino, con tono cercano, auténtico y nada exagerado.
No inventas datos sobre productos ni prometes resultados. Respeta las reglas y límites de cada red.`;

// Si un filtro de seguridad rechaza la petición, la API la reintenta sola con otro modelo.
const SAFETY = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const CaptionsSchema = z.object({
  captions: z.array(z.string()).describe("Tres opciones de caption distintas entre sí"),
});

export async function suggestCaptions(input: {
  topic: string;
  contentType: ContentType;
  networks: PlanNetwork[];
  brandName?: string | null;
  draft?: string;
}) {
  const context = await getCreatorContext();
  const networks = input.networks.map((n) => NETWORK_META[n].label).join(", ") || "Instagram";
  const response = await getAiClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(CaptionsSchema) },
    ...SAFETY,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `${context}

Escribe 3 opciones de caption para: ${CONTENT_TYPE_LABEL[input.contentType]} en ${networks}.
Tema: ${input.topic || "contenido de su nicho"}.
${input.brandName ? `Es una colaboración con la marca ${input.brandName}: menciónala de forma natural y agrega #publi o #ad al final.` : ""}
${input.draft ? `Borrador actual (mejóralo, no lo repitas): ${input.draft}` : ""}
Cada opción: gancho en la primera línea, máximo 3 líneas cortas y 3 a 5 hashtags relevantes al final.`,
      },
    ],
  });
  await recordAiUsage("caption", response.usage);
  if (response.stop_reason === "refusal") throw new Error("La IA no pudo generar esta sugerencia");
  return response.parsed_output?.captions.slice(0, 3) ?? [];
}

const TipsSchema = z.object({
  networks: z.array(
    z.object({
      network: z.string().describe("Nombre de la red tal como se dio"),
      tips: z.array(z.string()).describe("2 o 3 consejos concretos y accionables"),
    })
  ),
});

export async function suggestNetworkTips(input: { caption: string; contentType: ContentType; networks: PlanNetwork[] }) {
  const labels = input.networks.map((n) => NETWORK_META[n].label);
  const response = await getAiClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(TipsSchema) },
    ...SAFETY,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Una persona creadora de contenido va a publicar este ${CONTENT_TYPE_LABEL[input.contentType]} en: ${labels.join(", ")}.
Caption:
"""
${input.caption}
"""
Para cada red da 2 o 3 consejos breves (una línea cada uno) sobre cómo ejecutarlo ahí: duración o formato,
gancho de los primeros segundos, ajuste del texto o hashtags, y mejor hora si aplica. Sin introducciones.`,
      },
    ],
  });
  await recordAiUsage("tips", response.usage);
  if (response.stop_reason === "refusal") throw new Error("La IA no pudo analizar este caption");
  const byLabel = new Map(response.parsed_output?.networks.map((n) => [n.network.toLowerCase(), n.tips]) ?? []);
  return input.networks.map((network) => ({
    network,
    tips: byLabel.get(NETWORK_META[network].label.toLowerCase())?.slice(0, 3) ?? [],
  }));
}
