import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { hasRole, teamUser } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";
import { MIN_REVIEWS } from "@/lib/brand-reviews";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import BrandReviewModeration from "./BrandReviewModeration";

export const dynamic = "force-dynamic";

/** Departamento de Comunidad: comentarios de reseñas de marcas por aprobar y derecho de respuesta. */
export default async function BrandReviewModerationPage() {
  const { t } = await getT();
  const user = await teamUser();
  if (!hasRole(user, "community")) notFound();

  const [pending, replies, groups] = await Promise.all([
    prismaRoot.brandReview.findMany({ where: { commentStatus: "pending" }, orderBy: { updatedAt: "asc" }, take: 200, select: { id: true, brandName: true, payment: true, rating: true, comment: true } }),
    prismaRoot.brandReviewReply.findMany({ select: { brandKey: true, text: true } }),
    prismaRoot.brandReview.groupBy({ by: ["brandKey", "brandName"], _count: { _all: true }, orderBy: { brandName: "asc" }, take: 300 }),
  ]);
  const replyByKey = new Map(replies.map((r) => [r.brandKey, r.text]));

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("Reseñas de marcas", "Brand reviews")}
        description={t(
          "Aprueba solo comentarios con hechos del trato. Oculta lo que tenga insultos, acusaciones, datos personales o algo que no se pueda comprobar. Las marcas pueden pedir su derecho de respuesta por correo.",
          "Approve only comments about facts of the deal. Hide anything with insults, accusations, personal data or anything that can't be verified. Brands can request their right of reply by email."
        )}
      />
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t(`Comentarios por revisar (${pending.length})`, `Comments to review (${pending.length})`)}</p>
        <BrandReviewModeration
          pending={pending}
          brands={groups.map((g) => ({ key: g.brandKey, name: g.brandName, count: g._count._all, reply: replyByKey.get(g.brandKey) ?? "" }))}
          minReviews={MIN_REVIEWS}
        />
      </Card>
    </div>
  );
}
