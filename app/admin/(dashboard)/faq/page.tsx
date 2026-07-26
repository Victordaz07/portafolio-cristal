import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import FaqManager from "./FaqManager";

export default async function AdminFaqPage() {
  const faqItems = await prisma.faqItem.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${faqItems.length} preguntas`}
        title="FAQ"
        description="Lo que más preguntan las marcas antes de trabajar contigo."
      />
      <FaqManager initialFaqItems={faqItems} />
    </div>
  );
}
