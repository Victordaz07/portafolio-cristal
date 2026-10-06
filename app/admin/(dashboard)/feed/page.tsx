import { prisma } from "@/lib/prisma";
import type { Platform } from "@/lib/embeds";
import { getThumbnailUrl } from "@/lib/oembed";
import PageHeader from "@/components/admin/PageHeader";
import FeedManager from "./FeedManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminFeedPage() {
  const { t, lang } = await getT();
  const [cards, brands, connected] = await Promise.all([
    prisma.contentCard.findMany({ orderBy: { order: "asc" } }),
    prisma.brand.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, logoUrl: true } }),
    // Redes conectadas cuyas APIs dan métricas por publicación.
    prisma.socialAccount.findMany({ where: { platform: { in: ["instagram", "tiktok"] } }, select: { platform: true } }),
  ]);
  const categoryCounts = cards.reduce<Record<string, number>>((acc, card) => {
    const category = (lang === "en" && card.categoryEn) || card.category;
    acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, {});

  const thumbnails = await Promise.all(
    cards.map((card) => {
      if (card.thumbnailUrl) return Promise.resolve(card.thumbnailUrl);
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
          t(" tarjetas", " cards") +
          (Object.entries(categoryCounts).length > 0
            ? " — " +
              Object.entries(categoryCounts)
                .map(([category, count]) => t(`${count} en ${category}`, `${count} in ${category}`))
                .join(" · ")
            : "")
        }
        title={t("Feed / Publicaciones", "Feed / Posts")}
        description={t("El contenido que se muestra en la sección de fotos y videos del sitio, con sus métricas.", "The content shown in your site's photos and videos section, with its metrics.")}
      />
      <FeedManager
        initialCards={cards}
        thumbnailsById={thumbnailsById}
        brands={brands}
        syncablePlatforms={connected.map((a) => a.platform)}
      />
    </div>
  );
}
