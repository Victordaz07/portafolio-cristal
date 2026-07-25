import { prisma } from "@/lib/prisma";
import TestimonialsManager from "./TestimonialsManager";

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">
        Testimonios
      </h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {testimonials.length} testimonios
      </p>
      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  );
}
