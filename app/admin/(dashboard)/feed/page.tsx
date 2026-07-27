import { prisma } from "@/lib/prisma";
import type { Platform } from "@/lib/embeds";
import { getThumbnailUrl } from "@/lib/oembed";
import PageHeader from "@/components/admin/PageHeader";
import FeedManager from "./FeedManager";

export default async function AdminFeedPage() {
  const cards = await prisma.contentCard.findMany({ orderBy: { order: "asc" } });
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
      <FeedManager initialCards={cards} thumbnailsById={thumbnailsById} />
    </div>
  );
}
