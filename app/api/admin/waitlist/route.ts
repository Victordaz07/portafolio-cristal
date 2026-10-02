import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { isPlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Descarga la lista de espera en CSV (para Excel, Google Sheets o tu herramienta de correos). */
export async function GET() {
  if (!(await isPlatformAdmin())) return NextResponse.json({ error: "Solo para la dueña de Foliocrew" }, { status: 403 });
  const entries = await prismaRoot.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
  const header = ["posicion", "email", "instagram", "nicho", "seguidores", "utm_source", "utm_medium", "utm_campaign", "estado", "fecha"];
  const rows = entries.map((e, i) =>
    [i + 1, e.email, e.instagram, e.niche, e.audience, e.utmSource, e.utmMedium, e.utmCampaign, e.status === "invited" ? "invitada" : "en espera", e.createdAt]
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

const updateSchema = z.object({ ids: z.array(z.string()).min(1).max(500), invited: z.boolean() });

/** Marcar como invitadas (o volver a "en espera"). */
export async function PATCH(request: Request) {
  if (!(await isPlatformAdmin())) return NextResponse.json({ error: "Solo para la dueña de Foliocrew" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  await prismaRoot.waitlistEntry.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: parsed.data.invited ? { status: "invited", invitedAt: new Date() } : { status: "waiting", invitedAt: null },
  });
  return NextResponse.json({ ok: true });
}
