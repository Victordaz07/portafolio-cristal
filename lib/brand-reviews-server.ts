import { prisma } from "@/lib/prisma";
import { prismaRoot } from "@/lib/prisma-root";
import { currentCreatorId } from "@/lib/tenant";
import { DAILY_REVIEW_CAP, REVIEWABLE_DEAL_STATUSES, canReview, normalizeBrandKey, summarizeBrand, validateReview, type ReviewInput } from "@/lib/brand-reviews";

/** ¿Esta cuenta puede reseñar marcas? (correo verificado, antigüedad, activa y sin sanción) */
export async function reviewerEligibility(creatorId: string) {
  const [creator, owner, profile] = await Promise.all([
    prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { createdAt: true, status: true } }),
    prismaRoot.adminUser.findFirst({ where: { creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { emailVerifiedAt: true } }),
    prismaRoot.communityProfile.findUnique({ where: { creatorId }, select: { mutedUntil: true } }),
  ]);
  if (!creator) return { ok: false as const, reason: "inactive" as const };
  return canReview({
    emailVerified: Boolean(owner?.emailVerifiedAt),
    accountCreatedAt: creator.createdAt,
    active: creator.status === "active",
    muted: Boolean(profile?.mutedUntil && profile.mutedUntil > new Date()),
  });
}

/** Marcas de la cuenta con las que hubo trato (activo o completado) y lo que la persona ya escribió de cada una. */
export async function myReviewableBrands() {
  const creatorId = await currentCreatorId();
  const [brands, mine] = await Promise.all([
    prisma.brand.findMany({ where: { dealStatus: { in: [...REVIEWABLE_DEAL_STATUSES] } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prismaRoot.brandReview.findMany({ where: { reviewerId: creatorId } }),
  ]);
  const byKey = new Map(mine.map((r) => [r.brandKey, r]));
  return brands
    .map((b) => ({ id: b.id, name: b.name, key: normalizeBrandKey(b.name), review: byKey.get(normalizeBrandKey(b.name)) ?? null }))
    .filter((b) => b.key);
}

export type SubmitResult = { ok: true } | { ok: false; error: "brand" | "eligibility" | "cap" | "invalid"; reason?: string };

/** Guarda (o corrige) la reseña de la persona sobre una marca suya. El comentario queda pendiente hasta que Comunidad lo apruebe. */
export async function submitReview(brandId: string, input: ReviewInput): Promise<SubmitResult> {
  const creatorId = await currentCreatorId();
  const elig = await reviewerEligibility(creatorId);
  if (!elig.ok) return { ok: false, error: "eligibility", reason: elig.reason };
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { name: true, dealStatus: true } });
  if (!brand || !(REVIEWABLE_DEAL_STATUSES as readonly (string | null)[]).includes(brand.dealStatus)) return { ok: false, error: "brand" };
  const check = validateReview(input);
  if (!check.ok) return { ok: false, error: "invalid", reason: check.reason };
  const brandKey = normalizeBrandKey(brand.name);
  if (!brandKey) return { ok: false, error: "brand" };

  const existing = await prismaRoot.brandReview.findUnique({ where: { brandKey_reviewerId: { brandKey, reviewerId: creatorId } } });
  if (!existing) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    if ((await prismaRoot.brandReview.count({ where: { reviewerId: creatorId, createdAt: { gte: startOfDay } } })) >= DAILY_REVIEW_CAP) return { ok: false, error: "cap" };
  }
  // Si el comentario no cambió y ya estaba aprobado, sigue aprobado; si cambió, vuelve a revisión.
  const sameComment = existing && existing.comment === check.comment;
  const commentStatus = !check.comment ? "none" : sameComment && existing.commentStatus !== "none" ? existing.commentStatus : "pending";
  const data = { brandName: brand.name, payment: check.payment, payDays: check.payDays, rating: check.rating, comment: check.comment, commentStatus };
  await prismaRoot.brandReview.upsert({
    where: { brandKey_reviewerId: { brandKey, reviewerId: creatorId } },
    create: { brandKey, reviewerId: creatorId, ...data },
    update: data,
  });
  return { ok: true };
}

export async function deleteMyReview(brandKey: string) {
  const creatorId = await currentCreatorId();
  const result = await prismaRoot.brandReview.deleteMany({ where: { brandKey, reviewerId: creatorId } });
  return result.count > 0;
}

/** Marcas con reseñas suficientes (≥ 3 personas distintas). Nunca devuelve quién reseñó ni cuántas hay en las que no llegan al mínimo. */
export async function browseBrands(query: string) {
  const q = normalizeBrandKey(query);
  const rows = await prismaRoot.brandReview.findMany({
    where: q ? { brandKey: { contains: q } } : undefined,
    select: { brandKey: true, brandName: true, reviewerId: true, payment: true, payDays: true, rating: true, comment: true, commentStatus: true },
    take: 5000,
  });
  const groups = new Map<string, typeof rows>();
  for (const r of rows) groups.set(r.brandKey, [...(groups.get(r.brandKey) ?? []), r]);
  const replies = await prismaRoot.brandReviewReply.findMany({ where: { brandKey: { in: Array.from(groups.keys()) } } });
  const replyByKey = new Map(replies.map((r) => [r.brandKey, r.text]));
  return Array.from(groups.entries())
    .map(([key, list]) => ({ key, name: list[0].brandName, summary: summarizeBrand(list), reply: replyByKey.get(key) ?? null }))
    .filter((b) => b.summary.visible)
    .sort((a, b) => (b.summary.count ?? 0) - (a.summary.count ?? 0) || a.name.localeCompare(b.name))
    .slice(0, 60);
}
