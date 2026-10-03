import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensurePermanentThumbnail, isEphemeralCdnUrl } from "@/lib/social/thumbnail";

export const dynamic = "force-dynamic";

const contentCardUpdateSchema = z
  .object({
    type: z.enum(["video", "photo"]).optional(),
    platform: z.enum(["tiktok", "instagram", "facebook", "ugc"]).optional(),
    postUrl: z.string().url().nullable().optional().or(z.literal("")),
    videoUrl: z.string().url().nullable().optional().or(z.literal("")),
    photoUrl: z.string().url().nullable().optional().or(z.literal("")),
    thumbnailUrl: z.string().url().nullable().optional().or(z.literal("")),
    caption: z.string().min(1).optional(),
    captionEn: z.string().nullable().optional().or(z.literal("")),
    category: z.string().min(1).optional(),
    categoryEn: z.string().nullable().optional().or(z.literal("")),
    statPrimary: z.string().nullable().optional().or(z.literal("")),
    statPrimaryEn: z.string().nullable().optional().or(z.literal("")),
    statSecondary: z.string().nullable().optional().or(z.literal("")),
    statSecondaryEn: z.string().nullable().optional().or(z.literal("")),
    brandId: z.string().nullable().optional().or(z.literal("")),
    order: z.number().int().optional(),
  })
  .refine(
    (data) =>
      data.postUrl === undefined ||
      data.videoUrl === undefined ||
      data.photoUrl === undefined ||
      data.postUrl ||
      data.videoUrl ||
      data.photoUrl,
    {
      message: "Debes indicar la URL del post o subir un video/foto propio",
      path: ["postUrl"],
    }
  );

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = contentCardUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.postUrl === "") data.postUrl = null;
  if (data.videoUrl === "") data.videoUrl = null;
  if (data.photoUrl === "") data.photoUrl = null;
  if (data.thumbnailUrl === "") data.thumbnailUrl = null;
  if (data.captionEn === "") data.captionEn = null;
  if (data.categoryEn === "") data.categoryEn = null;
  if (data.statPrimary === "") data.statPrimary = null;
  if (data.statPrimaryEn === "") data.statPrimaryEn = null;
  if (data.statSecondary === "") data.statSecondary = null;
  if (data.statSecondaryEn === "") data.statSecondaryEn = null;
  if (data.brandId === "") data.brandId = null;

  // Red de seguridad: si llega un link de miniatura temporal de Meta (p. ej. pegado a mano), se resube a Blob antes de guardarlo.
  if (data.thumbnailUrl && isEphemeralCdnUrl(data.thumbnailUrl)) {
    const platform = data.platform ?? (await prisma.contentCard.findUnique({ where: { id }, select: { platform: true } }))?.platform;
    data.thumbnailUrl = await ensurePermanentThumbnail(data.thumbnailUrl, `content-cards/thumbnails/${platform ?? "instagram"}`);
  }

  const card = await prisma.contentCard.update({ where: { id }, data });
  return NextResponse.json(card);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contentCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
