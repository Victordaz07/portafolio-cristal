import { prisma } from "@/lib/prisma";
import ReviewsManager from "./ReviewsManager";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">
        Reseñas destacadas
      </h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {reviews.length} reseñas
      </p>
      <ReviewsManager initialReviews={reviews} />
    </div>
  );
}
