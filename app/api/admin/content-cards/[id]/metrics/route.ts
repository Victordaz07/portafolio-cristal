import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { editsMetrics } from "@/lib/verified";

export const dynamic = "force-dynamic";

const count = z.number().int().min(0).nullable().optional();
const text = z.string().trim().max(500).nullable().optional();

const metricsSchema = z.object({
  views: count,
  likes: count,
  comments: count,
  shares: count,
  saves: count,
  showMetrics: z.boolean().optional(),
  featured: z.boolean().optional(),
  topComment: text,
  topCommentEn: text,
  topCommentAuthor: z.string().trim().max(100).nullable().optional(),
  postedAt: z.string().datetime().nullable().optional(),
});

/** Edita a mano las métricas, el comentario destacado y si la pieza va destacada. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = metricsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los números", "Check the numbers") }, { status: 400 });
  const data = { ...parsed.data };
  for (const key of ["topComment", "topCommentEn", "topCommentAuthor"] as const) {
    if (data[key] === "") data[key] = null;
  }
  const { postedAt, ...rest } = data;
  const card = await prisma.contentCard.update({
    where: { id },
    // Un número escrito a mano ya no es «verificado»: se borra la marca de sincronización (C4).
    data: { ...rest, ...(editsMetrics(rest) && { metricsSyncedAt: null }), ...(postedAt !== undefined && { postedAt: postedAt ? new Date(postedAt) : null }) },
  });
  return NextResponse.json(card);
}
