import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";
import { SESSION_KINDS, validateSession } from "@/lib/circles";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(SESSION_KINDS.map((k) => k.id) as [string, ...string[]]),
  title: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(1000).default(""),
  descriptionEn: z.string().trim().max(1000).nullable().optional(),
  hostName: z.string().trim().min(1).max(80),
  /** Fecha y hora en formato ISO (con zona horaria) */
  startsAt: z.string().datetime({ offset: true }),
  durationMin: z.number().int().min(15).max(240),
  joinUrl: z.string().trim().max(800),
  crewOnly: z.boolean().default(false),
  capacity: z.number().int().min(1).max(1000).nullable().optional(),
  circleId: z.string().min(1).max(40).nullable().optional(),
});

const ERRORS = (t: (es: string, en: string) => string) => ({
  kind: t("Elige el tipo de sesión", "Choose the session type"),
  title: t("Escribe un título (máximo 120 caracteres)", "Write a title (120 characters max)"),
  host: t("Escribe quién la da (máximo 80 caracteres)", "Write who's hosting (80 characters max)"),
  date: t("La fecha no puede estar en el pasado", "The date can't be in the past"),
  duration: t("La duración va de 15 a 240 minutos", "Duration is 15 to 240 minutes"),
  url: t("El enlace de la videollamada debe empezar con https://", "The call link must start with https://"),
  capacity: t("El cupo debe ser un número entre 1 y 1000", "Capacity must be a number from 1 to 1000"),
  description: t("La descripción puede tener hasta 1000 caracteres", "The description can have up to 1000 characters"),
});

/** El equipo de Comunidad programa una sesión en vivo o mentoría grupal. */
export async function POST(request: Request) {
  const { t } = await getT();
  const user = await requireRole("community");
  if (!user) return NextResponse.json({ error: t("Solo el equipo de Comunidad", "Community team only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos de la sesión", "Check the session details") }, { status: 400 });
  const d = parsed.data;
  const check = validateSession({ ...d, startsAt: new Date(d.startsAt) });
  if (!check.ok) return NextResponse.json({ error: ERRORS(t)[check.reason] }, { status: 400 });
  if (d.circleId && !(await prismaRoot.circle.findUnique({ where: { id: d.circleId }, select: { id: true } }))) return NextResponse.json({ error: t("No se encontró el círculo", "Circle not found") }, { status: 404 });
  const session = await prismaRoot.liveSession.create({
    data: { ...d, titleEn: d.titleEn || null, descriptionEn: d.descriptionEn || null, startsAt: new Date(d.startsAt), capacity: d.capacity ?? null, circleId: d.circleId || null, createdBy: user.id },
  });
  return NextResponse.json(session, { status: 201 });
}
