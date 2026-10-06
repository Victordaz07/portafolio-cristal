import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { logPlatformAction, platformAdminUser } from "@/lib/platform-admin";
import { forgetHost, forgetSessionVersion } from "@/lib/tenant";
import { PLANS } from "@/lib/plans";
import { changeAccountEmail } from "@/lib/account-email-change";
import { setAmbassador } from "@/lib/ambassadors-server";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["active", "paused"]).optional(),
  adminNote: z.string().max(2000).optional(),
  /** Cuenta de cortesía: no paga ni vence. */
  comp: z.boolean().optional(),
  /** Embajadora de Foliocrew (nivel por invitación, se puede quitar). */
  ambassador: z.boolean().optional(),
  plan: z.enum(PLANS.map((p) => p.id) as [string, ...string[]]).optional(),
  /** Alarga (o da) la prueba gratis N días desde hoy o desde su fin actual. */
  extendTrialDays: z.number().int().min(1).max(90).optional(),
  /** Soporte: corrige el correo con el que entra la dueña de la cuenta (p. ej. se registró con uno ajeno). */
  ownerEmail: z.string().trim().email().max(200).optional(),
});

/** Pausar o reactivar una cuenta, o guardar la nota interna de soporte. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { status, adminNote, comp, ambassador, plan, extendTrialDays, ownerEmail } = parsed.data;

  const creator = await prismaRoot.creator.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      customDomain: true,
      status: true,
      trialEndsAt: true,
      users: { select: { id: true, role: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!creator) return NextResponse.json({ error: t("La cuenta no existe", "The account doesn't exist") }, { status: 404 });

  if (ownerEmail) {
    // Tu propia cuenta se cambia desde Mi cuenta (pide tu contraseña y avisa si pierdes el panel de dueño).
    if (creator.id === admin.creatorId) {
      return NextResponse.json({ error: t("Tu propio correo se cambia desde Mi cuenta", "Change your own email from My account") }, { status: 400 });
    }
    const owner = creator.users.find((u) => u.role === "owner") ?? creator.users[0];
    if (!owner) return NextResponse.json({ error: t("La cuenta no tiene usuaria", "The account has no user") }, { status: 400 });
    const result = await changeAccountEmail(owner.id, ownerEmail);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    await logPlatformAction(admin.email, "email", id, `${result.previous} → ${result.user.email}`);
    return NextResponse.json({ ok: true, email: result.user.email });
  }
  if (status === "paused" && creator.id === admin.creatorId) {
    return NextResponse.json({ error: t("No puedes pausar tu propia cuenta", "You can't pause your own account") }, { status: 400 });
  }

  await prismaRoot.creator.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(adminNote !== undefined ? { adminNote: adminNote.trim() || null } : {}),
      ...(comp !== undefined ? { comp } : {}),
      ...(plan ? { plan } : {}),
      ...(extendTrialDays
        ? {
            trialEndsAt: new Date(
              Math.max(Date.now(), creator.trialEndsAt?.getTime() ?? 0) + extendTrialDays * 86_400_000
            ),
            billingReminder: null,
          }
        : {}),
    },
  });
  if (ambassador !== undefined) await setAmbassador(id, ambassador, admin.email);
  if (comp !== undefined) await logPlatformAction(admin.email, comp ? "comp-on" : "comp-off", id);
  if (plan) await logPlatformAction(admin.email, "plan", id, plan);
  if (extendTrialDays) await logPlatformAction(admin.email, "trial", id, `+${extendTrialDays} días`);

  if (status && status !== creator.status) {
    // Que el cambio se note ya: sesiones y sitio público.
    forgetSessionVersion(...creator.users.map((u) => u.id));
    const root = (process.env.PLATFORM_ROOT_DOMAIN || "").split(":")[0];
    if (root) forgetHost(`${creator.slug}.${root}`);
    if (creator.customDomain) {
      forgetHost(creator.customDomain);
      forgetHost(`www.${creator.customDomain.replace(/^www\./, "")}`);
    }
    await logPlatformAction(admin.email, status === "paused" ? "pause" : "activate", id);
  }
  if (adminNote !== undefined) await logPlatformAction(admin.email, "note", id, adminNote.trim());
  return NextResponse.json({ ok: true });
}
