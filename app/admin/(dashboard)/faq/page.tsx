import { prisma } from "@/lib/prisma";
import FaqManager from "./FaqManager";

export default async function AdminFaqPage() {
  const faqItems = await prisma.faqItem.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">FAQ</h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {faqItems.length} preguntas
      </p>
      <FaqManager initialFaqItems={faqItems} />
    </div>
  );
}
