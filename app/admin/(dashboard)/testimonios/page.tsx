import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import TestimonialsManager from "./TestimonialsManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminTestimonialsPage() {
  const { t } = await getT();
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={t(`${testimonials.length} testimonios`, `${testimonials.length} testimonials`)}
        title={t("Testimonios", "Testimonials")}
        description={t("Lo que las marcas dicen sobre trabajar contigo.", "What brands say about working with you.")}
      />
      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}
