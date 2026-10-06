import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { ensureProfile } from "@/lib/community-server";
import { isCreatorType } from "@/lib/community";
import { NICHES } from "@/lib/onboarding";
import { tooManyAttempts } from "@/lib/rate-limit";
import { safeImageUrl } from "@/lib/community-schemas";

export const dynamic = "force-dynamic";

const schema = z.object({
  displayName: z.string().trim().min(2).max(60),
  headline: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(600).default(""),
  avatarUrl: safeImageUrl.default(""),
  city: z.string().trim().max(80).default(""),
  showCity: z.boolean().default(true),
  showSite: z.boolean().default(true),
  creatorTypes: z.array(z.string().refine(isCreatorType)).max(12).default([]),
  niche: z
    .string()
    .refine((v) => v === "" || NICHES.some((n) => n.id === v))
    .default(""),
  languages: z.array(z.enum(["es", "en"])).min(1).max(2).default(["es"]),
  openToCollab: z.boolean().default(false),
  emailNotify: z.boolean().default(true),
  /** La primera vez: "Acepto las reglas y entro". */
  acceptRules: z.boolean().optional(),
});

/** Mi perfil de comunidad (se crea solo la primera vez con los datos de Foliocrew). */
export async function GET() {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  return NextResponse.json({ profile: await ensureProfile(session.creatorId) });
}

/** Editar mi perfil (y aceptar las reglas la primera vez). */
export async function PUT(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) {
    return NextResponse.json({ error: t("El equipo no puede editar el perfil de comunidad de una cuenta", "The team can't edit an account's community profile") }, { status: 403 });
  }
  if (tooManyAttempts(`community-profile:${session.creatorId}`, 30, 60 * 60_000)) {
    return NextResponse.json({ error: t("Demasiados cambios seguidos. Espera un rato.", "Too many changes in a row. Wait a bit.") }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error =
      field === "displayName"
        ? t("Escribe tu nombre (2 a 60 caracteres)", "Enter your name (2 to 60 characters)")
        : field === "avatarUrl"
          ? t("La foto debe ser un enlace https", "The photo must be an https link")
          : t("Revisa los datos del perfil", "Check your profile details");
    return NextResponse.json({ error }, { status: 400 });
  }
  const { acceptRules, avatarUrl, city, niche, ...rest } = parsed.data;
  const current = await ensureProfile(session.creatorId);
  const profile = await prismaRoot.communityProfile.update({
    where: { id: current.id },
    data: {
      ...rest,
      avatarUrl: avatarUrl || null,
      city: city || null,
      niche: niche || null,
      ...(acceptRules && !current.acceptedRulesAt ? { acceptedRulesAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ profile });
}
