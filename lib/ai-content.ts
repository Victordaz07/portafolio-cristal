import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AI_MODEL, AiRefusalError, commitAiUsage, getAiClient, getCreatorContext, releaseAiUsage, reserveAiUsage } from "@/lib/ai";
import { CONTENT_TYPE_LABEL, NETWORK_META, type ContentType, type PlanNetwork } from "@/lib/content-plan";

const SYSTEM = `Eres asistente de una persona creadora de contenido que trabaja con marcas (el contexto dice si publica en sus redes, hace UGC o ambas cosas).
Escribes en español neutro latino, con tono cercano, auténtico y nada exagerado.
No inventas datos sobre productos ni prometes resultados. Respeta las reglas y límites de cada red.`;

/** Idioma de la respuesta: el del panel de quien la pide. */
const languageNote = (lang: "es" | "en") =>
  lang === "en"
    ? "\nIMPORTANT: write everything in natural US English (captions, hashtags and tips), even if the context above is in Spanish."
    : "";

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
  lang?: "es" | "en";
}) {
  const usageId = await reserveAiUsage("caption");
  const context = await getCreatorContext();
  const networks = input.networks.map((n) => NETWORK_META[n].label).join(", ") || "Instagram";
  let response;
  try {
    response = await getAiClient().beta.messages.parse({
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
${input.brandName ? `Es una colaboración pagada con la marca ${input.brandName}: menciónala de forma natural y empieza el caption con ${(input.lang ?? "es") === "en" ? "#ad" : "#publicidad"} (el aviso va AL INICIO de la primera línea, antes del gancho, para que se vea sin tocar «ver más»).` : ""}
${input.draft ? `Borrador actual (mejóralo, no lo repitas): ${input.draft}` : ""}
Cada opción: gancho en la primera línea, máximo 3 líneas cortas y 3 a 5 hashtags relevantes al final.${languageNote(input.lang ?? "es")}`,
        },
      ],
    });
  } catch (error) {
    await releaseAiUsage(usageId);
    throw error;
  }
  await commitAiUsage(usageId, response.usage);
  if (response.stop_reason === "refusal") throw new AiRefusalError();
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

export async function suggestNetworkTips(input: { caption: string; contentType: ContentType; networks: PlanNetwork[]; lang?: "es" | "en" }) {
  const usageId = await reserveAiUsage("tips");
  const labels = input.networks.map((n) => NETWORK_META[n].label);
  let response;
  try {
    response = await getAiClient().beta.messages.parse({
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
gancho de los primeros segundos, ajuste del texto o hashtags, y mejor hora si aplica. Sin introducciones.${languageNote(input.lang ?? "es")}`,
        },
      ],
    });
  } catch (error) {
    await releaseAiUsage(usageId);
    throw error;
  }
  await commitAiUsage(usageId, response.usage);
  if (response.stop_reason === "refusal") throw new AiRefusalError();
  const byLabel = new Map(response.parsed_output?.networks.map((n) => [n.network.toLowerCase(), n.tips]) ?? []);
  return input.networks.map((network) => ({
    network,
    tips: byLabel.get(NETWORK_META[network].label.toLowerCase())?.slice(0, 3) ?? [],
  }));
}
