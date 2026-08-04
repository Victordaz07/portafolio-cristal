import { prisma } from "@/lib/prisma";
import type { Platform } from "@/lib/embeds";
import { getThumbnailUrl } from "@/lib/oembed";
import PageHeader from "@/components/admin/PageHeader";
import FeedManager from "./FeedManager";

export default async function AdminFeedPage() {
  const [cards, brands] = await Promise.all([
    prisma.contentCard.findMany({ orderBy: { order: "asc" } }),
    prisma.brand.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, logoUrl: true } }),
  ]);
  const categoryCounts = cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.category] = (acc[card.category] ?? 0) + 1;
    return acc;
  }, {});

  const thumbnails = await Promise.all(
    cards.map((card) => {
      if (card.photoUrl) return Promise.resolve(card.photoUrl);
      if (card.postUrl) return getThumbnailUrl(card.platform as Platform, card.postUrl);
      return Promise.resolve(null);
    })
  );
  const thumbnailsById = Object.fromEntries(
    cards.map((card, index) => [card.id, thumbnails[index]])
  );

  return (
    <div>
      <PageHeader
        eyebrow={
          cards.length +
          " tarjetas" +
          (Object.entries(categoryCounts).length > 0
            ? " — " +
              Object.entries(categoryCounts)
                .map(([category, count]) => `${count} en ${category}`)
                .join(" · ")
            : "")
        }
        title="Feed"
        description="El contenido que se muestra en la sección de fotos y videos del sitio."
      />
      <FeedManager initialCards={cards} thumbnailsById={thumbnailsById} brands={brands} />
    </div>
  );
}
