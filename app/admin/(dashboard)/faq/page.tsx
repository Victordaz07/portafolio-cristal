import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import FaqManager from "./FaqManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminFaqPage() {
  const { t } = await getT();
  const faqItems = await prisma.faqItem.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={t(`${faqItems.length} preguntas`, `${faqItems.length} questions`)}
        title="FAQ"
        description={t("Lo que más preguntan las marcas antes de trabajar contigo.", "What brands ask most before working with you.")}
      />
      <FaqManager initialFaqItems={faqItems} />
    </div>
  );
}
