import { NextResponse } from "next/server";
import { z } from "zod";
import { httpUrl } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { ensurePermanentThumbnail, isEphemeralCdnUrl } from "@/lib/social/thumbnail";
import { assertMediaQuota, StorageQuotaError, storageQuotaErrorMessage } from "@/lib/storage-quota";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const contentCardSchema = z
  .object({
    type: z.enum(["video", "photo"]),
    platform: z.enum(["tiktok", "instagram", "facebook", "ugc"]),
    postUrl: httpUrl().optional().or(z.literal("")),
    videoUrl: httpUrl().optional().or(z.literal("")),
    photoUrl: httpUrl().optional().or(z.literal("")),
    thumbnailUrl: httpUrl().optional().or(z.literal("")),
    caption: z.string().min(1),
    captionEn: z.string().optional().or(z.literal("")),
    category: z.string().min(1),
    categoryEn: z.string().optional().or(z.literal("")),
    statPrimary: z.string().optional().or(z.literal("")),
    statPrimaryEn: z.string().optional().or(z.literal("")),
    statSecondary: z.string().optional().or(z.literal("")),
    statSecondaryEn: z.string().optional().or(z.literal("")),
    brandId: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.postUrl || data.videoUrl || data.photoUrl, {
    message: "Debes indicar la URL del post o subir un video/foto propio",
    path: ["postUrl"],
  });

export async function GET() {
  const cards = await prisma.contentCard.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const { t, lang } = await getT();
  const body = await request.json().catch(() => null);
  const parsed = contentCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  }

  // Cuota de almacenamiento: un post solo enlazado (postUrl) no cuenta, no ocupa nuestro Blob.
  if (parsed.data.photoUrl || parsed.data.videoUrl) {
    try {
      await assertMediaQuota();
    } catch (error) {
      if (error instanceof StorageQuotaError) {
        return NextResponse.json({ error: storageQuotaErrorMessage(error, lang) }, { status: 429 });
      }
      throw error;
    }
  }

  // Red de seguridad: si llega un link de miniatura temporal de Meta (p. ej. pegado a mano), se resube a Blob antes de guardarlo.
  const thumbnailUrl =
    parsed.data.thumbnailUrl && isEphemeralCdnUrl(parsed.data.thumbnailUrl)
      ? await ensurePermanentThumbnail(parsed.data.thumbnailUrl, `content-cards/thumbnails/${parsed.data.platform}`)
      : parsed.data.thumbnailUrl || null;

  const maxOrder = await prisma.contentCard.aggregate({ _max: { order: true } });
  const card = await prisma.contentCard.create({
    data: {
      ...parsed.data,
      postUrl: parsed.data.postUrl || null,
      videoUrl: parsed.data.videoUrl || null,
      photoUrl: parsed.data.photoUrl || null,
      thumbnailUrl,
      captionEn: parsed.data.captionEn || null,
      categoryEn: parsed.data.categoryEn || null,
      statPrimary: parsed.data.statPrimary || null,
      statPrimaryEn: parsed.data.statPrimaryEn || null,
      statSecondary: parsed.data.statSecondary || null,
      statSecondaryEn: parsed.data.statSecondaryEn || null,
      brandId: parsed.data.brandId || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
