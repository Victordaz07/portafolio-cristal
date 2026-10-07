import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandCrmInclude, brandFieldsSchema, toBrandData, autoEventNotes } from "@/lib/brand-crm";
import { cleanupBlobUrls } from "@/lib/blob-cleanup";
import { getT } from "@/lib/admin-lang-server";
import { currentCreatorId } from "@/lib/tenant";
import { createReportDraft } from "@/lib/campaign-report-server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = brandFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  }

  const before = await prisma.brand.findUnique({
    where: { id },
    select: { dealStatus: true, paymentStatus: true, logoUrl: true },
  });
  if (!before) {
    return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  }

  const creatorId = await currentCreatorId();
  const notes = autoEventNotes(before, parsed.data, lang);
  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...toBrandData(parsed.data),
      // En un create anidado, BrandEvent no pasa por lib/prisma.ts: hay que poner su creatorId.
      events: notes.length ? { create: notes.map((note) => ({ note, creatorId })) } : undefined,
    },
    include: brandCrmInclude,
  });

  // Limpia el logo anterior si se reemplazó, para no acumular blobs huérfanos.
  if (parsed.data.logoUrl !== undefined && parsed.data.logoUrl !== before.logoUrl) {
    await cleanupBlobUrls([before.logoUrl]);
  }

  // Al completar un trato se arma solo el borrador del reporte de campaña (C3); la creadora lo revisa antes de enviarlo.
  if (parsed.data.dealStatus === "completed" && before.dealStatus !== "completed") {
    try {
      const draft = await createReportDraft(id, lang);
      if (draft?.created) {
        await prisma.brandEvent.create({ data: { brandId: id, note: lang === "en" ? "Campaign report ready to review" : "Reporte de campaña listo para revisar" } });
        return NextResponse.json(await prisma.brand.findUnique({ where: { id }, include: brandCrmInclude }));
      }
    } catch (error) {
      console.error("No se pudo armar el reporte de campaña", error);
    }
  }
  return NextResponse.json(brand);
}

/** Soft-delete: desactiva la marca en vez de borrarla, para no perder el historial de colaboraciones. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await prisma.brand.update({
    where: { id },
    data: { active: false },
    include: brandCrmInclude,
  });
  return NextResponse.json(brand);
}
