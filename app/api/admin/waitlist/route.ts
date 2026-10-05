import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { emailConfigured, sendEmail } from "@/lib/email";
import { waitlistInviteEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  waiting: "en espera",
  invited: "invitación enviada",
  joined: "cuenta creada",
};

function csvCell(value: unknown) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Descarga la lista de espera en CSV (para Excel, Google Sheets o tu herramienta de correos). */
export async function GET() {
  const { t } = await getT();
  if (!(await isPlatformAdmin())) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const entries = await prismaRoot.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
  const header = ["posicion", "email", "instagram", "nicho", "seguidores", "utm_source", "utm_medium", "utm_campaign", "estado", "fecha"];
  const rows = entries.map((e, i) =>
    [i + 1, e.email, e.instagram, e.niche, e.audience, e.utmSource, e.utmMedium, e.utmCampaign, STATUS_LABEL[e.status] ?? e.status, e.createdAt]
      .map(csvCell)
      .join(",")
  );
  return new NextResponse([header.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="foliocrew-lista-de-espera.csv"`,
    },
  });
}

const updateSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  /** "email": manda la invitación por correo · "invited": solo marcar · "waiting": volver a espera */
  action: z.enum(["email", "invited", "waiting"]),
});

/** Invitar por correo, marcar la invitación como enviada o volver a "en espera". */
export async function PATCH(request: Request) {
  const { t } = await getT();
  if (!(await isPlatformAdmin())) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { ids, action } = parsed.data;
  // Quien ya creó su cuenta no vuelve a la lista ni recibe otra invitación.
  const where = { id: { in: ids }, status: { not: "joined" } };

  if (action === "waiting") {
    await prismaRoot.waitlistEntry.updateMany({ where, data: { status: "waiting", invitedAt: null } });
    return NextResponse.json({ ok: true });
  }
  if (action === "invited") {
    await prismaRoot.waitlistEntry.updateMany({ where, data: { status: "invited", invitedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  const inviteCode = process.env.SIGNUP_INVITE_CODE;
  if (!inviteCode) return NextResponse.json({ error: t("Falta SIGNUP_INVITE_CODE en Vercel", "SIGNUP_INVITE_CODE is missing in Vercel") }, { status: 400 });
  if (!emailConfigured()) return NextResponse.json({ error: t("Falta RESEND_API_KEY en Vercel", "RESEND_API_KEY is missing in Vercel") }, { status: 400 });
  const origin = await platformOrigin();
  const entries = await prismaRoot.waitlistEntry.findMany({ where });
  let sent = 0;
  for (const entry of entries) {
    const mail = waitlistInviteEmail({ origin, name: entry.name, registerUrl: `${origin}/admin/registro`, inviteCode });
    const result = await sendEmail({ to: entry.email, ...mail });
    if (!result.sent) continue;
    sent += 1;
    await prismaRoot.waitlistEntry.update({ where: { id: entry.id }, data: { status: "invited", invitedAt: new Date() } });
  }
  return NextResponse.json({ ok: true, sent, failed: entries.length - sent });
}
