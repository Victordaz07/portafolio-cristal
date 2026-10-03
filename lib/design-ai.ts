import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AI_MODEL, getAiClient, recordAiUsage } from "./ai";
import { ACCENTS } from "./theme";
import { BACKGROUNDS, CORNERS, FONTS, HEROES, STYLES, type BackgroundId, type CornerId, type FontId, type HeroId, type StyleId } from "./design";
import { nicheOf } from "./platform-analytics";

// "Diséñalo por mí": Claude propone una combinación del Estudio de diseño según el nicho y la bio.
// Solo puede elegir entre las opciones existentes (enums), así la propuesta siempre es válida.

const keys = <T extends object>(obj: T) => Object.keys(obj) as [string, ...string[]];

const SuggestionSchema = z.object({
  style: z.enum(keys(STYLES)),
  font: z.enum(keys(FONTS)),
  accent: z.enum(keys(ACCENTS)).describe("Una de las paletas de acento"),
  hero: z.enum(keys(HEROES)),
  corners: z.enum(keys(CORNERS)),
  background: z.enum(keys(BACKGROUNDS)),
  reason: z.string().describe("Por qué esta combinación le queda, en 2 frases cortas, hablándole de tú"),
});

export interface DesignSuggestion {
  style: StyleId;
  font: FontId;
  accent: string;
  hero: HeroId;
  corners: CornerId;
  background: BackgroundId;
  reason: string;
}

const catalog = () =>
  [
    `Estilos: ${Object.entries(STYLES).map(([id, s]) => `${id} (${s.description})`).join("; ")}`,
    `Tipografías: ${Object.entries(FONTS).map(([id, f]) => `${id} (${f.hint})`).join("; ")}`,
    `Acentos: ${Object.entries(ACCENTS).map(([id, a]) => `${id} (${a.label})`).join("; ")}`,
    `Portadas: ${Object.entries(HEROES).map(([id, h]) => `${id} (${h.hint})`).join("; ")}`,
    `Bordes: ${keys(CORNERS).join(", ")}. Fondos: ${keys(BACKGROUNDS).join(", ")}.`,
  ].join("\n");

export async function suggestDesign(input: { name: string; niche: string; bio: string; current?: Partial<DesignSuggestion> }): Promise<DesignSuggestion> {
  const response = await getAiClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 3000,
    output_config: { effort: "low", format: betaZodOutputFormat(SuggestionSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `Eres directora de arte de Foliocrew, una plataforma de portafolios para creadores de contenido (incluidos creadores UGC).
Eliges una combinación de diseño coherente para el sitio de una persona creadora: que transmita su nicho y su personalidad
y que las marcas la vean profesional. Respondes en español neutro.`,
    messages: [
      {
        role: "user",
        content: `Opciones disponibles:
${catalog()}

Persona creadora: ${input.name || "sin nombre"}. Nicho: ${input.niche || "contenido general"}.
Bio: ${input.bio.slice(0, 600) || "(sin bio)"}
${input.current ? `Ya vio esta propuesta y quiere otra distinta: ${JSON.stringify(input.current)}` : ""}

Elige una combinación (estilo, tipografía, acento, portada, bordes y fondo) y explica por qué en 2 frases.`,
      },
    ],
  });
  await recordAiUsage("design", response.usage);
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("La IA no pudo proponer un diseño");
  return response.parsed_output as DesignSuggestion;
}

/** Sin IA configurada: una propuesta razonable por nicho. */
export function fallbackDesign(niche: string, variant = 0): DesignSuggestion {
  const byNiche: Record<string, Omit<DesignSuggestion, "reason">[]> = {
    belleza: [
      { style: "soft", font: "elegante", accent: "rosa", hero: "centered", corners: "redondo", background: "degradado" },
      { style: "editorial", font: "editorial", accent: "lila", hero: "split", corners: "suave", background: "textura" },
    ],
    skincare: [
      { style: "minimal", font: "clasica", accent: "salvia", hero: "split", corners: "suave", background: "liso" },
      { style: "soft", font: "elegante", accent: "rosa", hero: "centered", corners: "redondo", background: "degradado" },
    ],
    moda: [
      { style: "bold", font: "impacto", accent: "terracota", hero: "magazine", corners: "recto", background: "liso" },
      { style: "noche", font: "elegante", accent: "dorado", hero: "cover", corners: "suave", background: "degradado" },
    ],
    fitness: [
      { style: "bold", font: "moderna", accent: "terracota", hero: "cover", corners: "recto", background: "liso" },
      { style: "noche", font: "impacto", accent: "salvia", hero: "cover", corners: "recto", background: "degradado" },
    ],
    comida: [
      { style: "editorial", font: "divertida", accent: "terracota", hero: "split", corners: "redondo", background: "textura" },
      { style: "soft", font: "divertida", accent: "dorado", hero: "centered", corners: "redondo", background: "degradado" },
    ],
    tecnologia: [
      { style: "minimal", font: "moderna", accent: "azul", hero: "split", corners: "recto", background: "liso" },
      { style: "noche", font: "moderna", accent: "azul", hero: "cover", corners: "suave", background: "degradado" },
    ],
  };
  const options = byNiche[nicheOf(niche).id] ?? [
    { style: "editorial", font: "editorial", accent: "lila", hero: "split", corners: "suave", background: "textura" },
    { style: "minimal", font: "moderna", accent: "azul", hero: "centered", corners: "suave", background: "liso" },
    { style: "noche", font: "elegante", accent: "rosa", hero: "cover", corners: "suave", background: "degradado" },
  ];
  const pick = options[variant % options.length];
  return {
    ...pick,
    reason: `Una combinación pensada para ${nicheOf(niche).label === "Otros / varios" ? "tu contenido" : nicheOf(niche).label.toLowerCase()}: ${STYLES[pick.style].description.toLowerCase()} Puedes ajustar cada detalle abajo.`,
  };
}
