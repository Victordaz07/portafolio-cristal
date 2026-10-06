import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { prismaRoot } from "./prisma-root";
import { AI_MODEL, getAiClient, isAiConfigured } from "./ai";
import { adminEmails } from "./platform-admin";
import { ensureProfile } from "./community-server";
import { TOPICS, isTopic } from "./community";
import { NICHES } from "./onboarding";

// Pregunta de la semana: una publicación fijada del equipo de Foliocrew para animar la conversación.
// Corre dentro del cron diario de Inteligencia (Vercel limita la cantidad de crons) y solo publica
// si no hubo una pregunta en los últimos 6 días. Se escribe en español e inglés.

const WEEK_MS = 6 * 86_400_000;

/** Preguntas de respaldo si la IA no está configurada (rotan por semana del año). */
const FALLBACK = [
  {
    topic: "marcas_y_dinero",
    title: "¿Cómo decidiste tu primer precio para una marca?",
    body: "Cuenta cómo calculaste cuánto cobrar la primera vez y qué cambiarías hoy. Así quien está empezando tiene un punto de partida real.",
    titleEn: "How did you set your first price for a brand?",
    bodyEn: "Share how you worked out what to charge the first time and what you'd change today. It gives people just starting out a real reference point.",
  },
  {
    topic: "contenido_y_edicion",
    title: "¿Cuál es tu gancho de los primeros 3 segundos que más te funciona?",
    body: "Comparte la estructura (no hace falta el video): qué dices o muestras primero y por qué crees que retiene.",
    titleEn: "What's your best-performing hook for the first 3 seconds?",
    bodyEn: "Share the structure (no need for the video): what you say or show first and why you think it keeps people watching.",
  },
  {
    topic: "herramientas",
    title: "¿Qué herramienta te ahorra más tiempo cada semana?",
    body: "App de edición, plantilla, automatización… lo que sea. Di para qué la usas y si es gratis o de pago.",
    titleEn: "What tool saves you the most time every week?",
    bodyEn: "Editing app, template, automation… anything. Say what you use it for and whether it's free or paid.",
  },
  {
    topic: "bienestar",
    title: "¿Cómo evitas quemarte creando contenido?",
    body: "Rutinas, límites, días libres, cómo manejas los comentarios negativos… Lo que te ayuda a seguir con ganas.",
    titleEn: "How do you avoid burning out as a creator?",
    bodyEn: "Routines, boundaries, days off, how you handle negative comments… Whatever keeps you motivated.",
  },
  {
    topic: "crecimiento",
    title: "¿Qué hiciste distinto el mes en que más creciste?",
    body: "Piensa en tu mejor mes: ¿cambiaste formato, frecuencia, horario, tema? Cuéntalo con números si puedes.",
    titleEn: "What did you do differently in your fastest-growing month?",
    bodyEn: "Think of your best month: did you change format, frequency, timing, topic? Share numbers if you can.",
  },
] as const;

const QuestionSchema = z.object({
  topic: z.string().describe(`Uno de: ${TOPICS.map((t) => t.id).join(", ")}`),
  title: z.string().describe("La pregunta en español neutro, máximo 120 caracteres"),
  body: z.string().describe("2 o 3 frases en español que inviten a responder con experiencia real, sin pedir datos personales"),
  titleEn: z.string().describe("La misma pregunta en inglés natural (EE. UU.)"),
  bodyEn: z.string().describe("El mismo texto en inglés natural (EE. UU.)"),
});

/** Cuenta con la que publica el equipo: la del primer correo de PLATFORM_ADMIN_EMAILS. */
async function teamAuthor() {
  const email = adminEmails()[0];
  if (!email) return null;
  const user = await prismaRoot.adminUser.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { creatorId: true } });
  if (!user) return null;
  const profile = await ensureProfile(user.creatorId);
  if (!profile.acceptedRulesAt) await prismaRoot.communityProfile.update({ where: { id: profile.id }, data: { acceptedRulesAt: new Date() } });
  return { creatorId: user.creatorId, profileId: profile.id };
}

async function writeQuestion(): Promise<(typeof FALLBACK)[number] | z.infer<typeof QuestionSchema>> {
  const fallback = FALLBACK[Math.floor(Date.now() / (7 * 86_400_000)) % FALLBACK.length];
  if (!isAiConfigured()) return fallback;
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [profiles, recent, previous] = await Promise.all([
    prismaRoot.communityProfile.groupBy({ by: ["niche"], where: { acceptedRulesAt: { not: null } }, _count: { _all: true } }),
    prismaRoot.communityPost.findMany({ where: { createdAt: { gte: since }, deletedAt: null, hiddenAt: null }, orderBy: { createdAt: "desc" }, take: 25, select: { kind: true, topic: true, title: true } }),
    prismaRoot.communityPost.findMany({ where: { fromTeam: true }, orderBy: { createdAt: "desc" }, take: 8, select: { title: true } }),
  ]);
  const niches = profiles
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5)
    .map((p) => NICHES.find((n) => n.id === p.niche)?.label ?? "varios")
    .join(", ");
  try {
    const response = await getAiClient().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 2000,
      output_config: { effort: "low", format: betaZodOutputFormat(QuestionSchema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `Eres quien anima la comunidad de Foliocrew, una plataforma para creadores de contenido de todo tipo (YouTube, TikTok, Instagram, podcast, streaming, UGC, fotografía, escritura…).
Cada semana propones UNA pregunta abierta que invite a compartir experiencia real y útil para otros creadores. Lenguaje inclusivo y neutro.
Nada de pedir datos personales, ni temas de política o religión. No repitas preguntas anteriores.`,
      messages: [
        {
          role: "user",
          content: `Nichos más presentes: ${niches || "varios"}.
Publicaciones recientes (no repitas el tema exacto):
${recent.map((p) => `- [${p.kind}/${p.topic}] ${p.title}`).join("\n") || "- (todavía pocas)"}
Preguntas de semanas anteriores:
${previous.map((p) => `- ${p.title}`).join("\n") || "- (ninguna)"}

Propón la pregunta de esta semana.`,
        },
      ],
    });
    const q = response.parsed_output;
    if (response.stop_reason === "refusal" || !q) return fallback;
    return q;
  } catch (error) {
    console.error("No se pudo escribir la pregunta de la semana con IA", error);
    return fallback;
  }
}

/** Publica la pregunta de la semana (si toca, o siempre con `force`). Devuelve el id o el motivo. */
export async function publishWeeklyQuestion({ force = false } = {}) {
  if (!force) {
    const recent = await prismaRoot.communityPost.findFirst({
      where: { fromTeam: true, pinned: true, deletedAt: null, createdAt: { gte: new Date(Date.now() - WEEK_MS) } },
      select: { id: true },
    });
    if (recent) return { skipped: "ya hay una pregunta esta semana" as const };
  }
  const author = await teamAuthor();
  if (!author) return { skipped: "falta la cuenta del equipo (PLATFORM_ADMIN_EMAILS)" as const };
  const q = await writeQuestion();
  const clip = (s: string, n: number) => s.trim().slice(0, n);
  const [, post] = await prismaRoot.$transaction([
    prismaRoot.communityPost.updateMany({ where: { fromTeam: true, pinned: true }, data: { pinned: false } }),
    prismaRoot.communityPost.create({
      data: {
        creatorId: author.creatorId,
        profileId: author.profileId,
        kind: "pregunta",
        topic: isTopic(q.topic) ? q.topic : "otro",
        title: clip(q.title, 140),
        body: clip(q.body, 2000),
        titleEn: clip(q.titleEn, 140),
        bodyEn: clip(q.bodyEn, 2000),
        pinned: true,
        fromTeam: true,
      },
      select: { id: true },
    }),
  ]);
  return { id: post.id };
}
