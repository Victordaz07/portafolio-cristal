import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ReviewsManager from "./ReviewsManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminReviewsPage() {
  const { t } = await getT();
  const reviews = await prisma.review.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={t(`${reviews.length} reseñas`, `${reviews.length} reviews`)}
        title={t("Reseñas destacadas", "Featured reviews")}
        description={t("Reseñas de producto que se muestran en la sección pública del mismo nombre.", "Product reviews shown in the public section with the same name.")}
      />
      <ReviewsManager initialReviews={reviews} />
    </div>
  );
}
