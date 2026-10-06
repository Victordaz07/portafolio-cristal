import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AI_MODEL, AiRefusalError, assertAiQuota, getAiClient, getCreatorContext, recordAiUsage } from "@/lib/ai";

// Propuestas a marcas escritas con IA (C1). La persona las envía desde su propio correo: Foliocrew no manda nada a la marca.

export const PITCH_TONES = ["cercano", "profesional", "directo"] as const;
export type PitchTone = (typeof PITCH_TONES)[number];

const TONE_NOTE: Record<PitchTone, string> = {
  cercano: "Tono cercano y cálido, como escribirle a alguien que ya te cae bien, sin ser informal en exceso.",
  profesional: "Tono profesional y cuidado, claro y respetuoso, sin sonar rígido.",
  directo: "Tono directo y breve: ve al grano en las primeras dos líneas.",
};

const SYSTEM = `Eres asistente de una persona creadora de contenido que escribe a marcas para proponerles una colaboración (el contexto dice si publica en sus redes, hace UGC o ambas cosas).
Escribes correos cortos, humanos y específicos; nunca suenan a plantilla masiva.
REGLAS: no inventes datos sobre la marca, sus productos, su campaña ni sobre la persona (cifras, premios, clientes). Usa solo lo que se te da.
Si no sabes algo de la marca, no lo afirmes: habla de lo que la persona hace y de la idea. No prometas resultados. No uses tácticas de presión ni falsa urgencia.`;

// Si un filtro de seguridad rechaza la petición, la API la reintenta sola con otro modelo.
const SAFETY = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const PitchSchema = z.object({
  subject: z.string().describe("Asunto del correo, máximo 60 caracteres, sin mayúsculas gritonas ni signos de exclamación"),
  body: z.string().describe("Cuerpo del correo en texto plano, con saludo y despedida, párrafos separados por una línea en blanco"),
  ideas: z.array(z.string()).describe("1 o 2 ideas de contenido concretas para esta marca (una línea cada una)"),
});

export interface PitchInput {
  brandName: string;
  /** Web o Instagram de la marca, tal como la persona lo escribió (no se visita). */
  brandLink?: string;
  /** Lo que la persona quiere ofrecer. */
  offer: string;
  tone: PitchTone;
  /** Idioma del correo (el de la marca, no necesariamente el del panel). */
  lang: "es" | "en";
  /** Enlace al media kit público de la persona. */
  mediaKitUrl: string;
  /** null = propuesta nueva; 1 o 2 = seguimiento (a los 5 o 12 días). */
  followUp?: 1 | 2 | null;
  contactName?: string;
}

function promptFor(input: PitchInput, context: string) {
  const language =
    input.lang === "en"
      ? "Write the whole email in natural US English (subject, body and ideas), even though the context above is in Spanish."
      : "Escribe todo el correo en español neutro latino.";
  const followNote =
    input.followUp === 1
      ? `Es el SEGUIMIENTO 1 (a los 5 días de la propuesta, sin respuesta). Máximo 60 palabras: un recordatorio amable que retoma la idea, aporta un detalle nuevo mínimo y facilita contestar con una frase. No reproches que no hayan respondido.`
      : input.followUp === 2
        ? `Es el SEGUIMIENTO 2 (a los 12 días, el último). Máximo 50 palabras: breve, cierra el hilo con elegancia, deja la puerta abierta y da una salida fácil ("si no es el momento, lo entiendo"). Sin culpar.`
        : `Es la PROPUESTA inicial. Entre 90 y 130 palabras: quién eres en una línea, por qué esta marca (solo con lo que se te dio), la propuesta concreta, el enlace al media kit y una invitación sencilla a conversar 15 minutos o responder.`;
  return `${context}

Marca: ${input.brandName}.${input.brandLink ? `\nSu web o Instagram (la persona lo escribió; no lo has visitado): ${input.brandLink}` : ""}${input.contactName ? `\nContacto: ${input.contactName}.` : ""}
Lo que la persona quiere ofrecer: ${input.offer}
Enlace al media kit (inclúyelo tal cual en el cuerpo, una sola vez): ${input.mediaKitUrl}
${TONE_NOTE[input.tone]}
${followNote}
En "ideas" da 1 o 2 ideas de contenido concretas y creíbles para esta marca, sin afirmar datos que no tengas.
${language}`;
}

export async function suggestPitch(input: PitchInput) {
  await assertAiQuota();
  const context = await getCreatorContext();
  const response = await getAiClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(PitchSchema) },
    ...SAFETY,
    system: SYSTEM,
    messages: [{ role: "user", content: promptFor(input, context) }],
  });
  await recordAiUsage("pitch", response.usage);
  if (response.stop_reason === "refusal") throw new AiRefusalError();
  const out = response.parsed_output;
  if (!out) throw new AiRefusalError();
  return { subject: out.subject.trim().slice(0, 120), body: out.body.trim(), ideas: out.ideas.map((i) => i.trim()).filter(Boolean).slice(0, 2) };
}
