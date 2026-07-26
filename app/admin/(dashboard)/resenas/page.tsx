import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ReviewsManager from "./ReviewsManager";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${reviews.length} reseñas`}
        title="Reseñas destacadas"
        description="Reseñas de producto que se muestran en la sección pública del mismo nombre."
      />
      <ReviewsManager initialReviews={reviews} />
    </div>
  );
}
