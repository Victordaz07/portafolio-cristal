import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import TestimonialsManager from "./TestimonialsManager";

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${testimonials.length} testimonios`}
        title="Testimonios"
        description="Lo que las marcas dicen sobre trabajar contigo."
      />
      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}
