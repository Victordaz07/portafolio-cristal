import { prisma } from "@/lib/prisma";
import FeedManager from "./FeedManager";

export default async function AdminFeedPage() {
  const cards = await prisma.contentCard.findMany({ orderBy: { order: "asc" } });
  const categoryCounts = cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.category] = (acc[card.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">Feed</h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {cards.length} tarjetas
        {Object.entries(categoryCounts).length > 0 &&
          " — " +
            Object.entries(categoryCounts)
              .map(([category, count]) => `${count} en ${category}`)
              .join(" · ")}
      </p>
      <FeedManager initialCards={cards} />
    </div>
  );
}
