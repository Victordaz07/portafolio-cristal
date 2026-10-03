import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { logPlatformAction, platformAdminUser } from "@/lib/platform-admin";
import { forgetHost, forgetSessionVersion } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["active", "paused"]).optional(),
  adminNote: z.string().max(2000).optional(),
});

/** Pausar o reactivar una cuenta, o guardar la nota interna de soporte. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: "Solo para quien administra Foliocrew" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { status, adminNote } = parsed.data;

  const creator = await prismaRoot.creator.findUnique({
    where: { id },
    select: { id: true, slug: true, customDomain: true, status: true, users: { select: { id: true } } },
  });
  if (!creator) return NextResponse.json({ error: "La cuenta no existe" }, { status: 404 });
  if (status === "paused" && creator.id === admin.creatorId) {
    return NextResponse.json({ error: "No puedes pausar tu propia cuenta" }, { status: 400 });
  }

  await prismaRoot.creator.update({
    where: { id },
    data: { ...(status ? { status } : {}), ...(adminNote !== undefined ? { adminNote: adminNote.trim() || null } : {}) },
  });

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
