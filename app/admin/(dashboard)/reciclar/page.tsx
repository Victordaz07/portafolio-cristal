import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { isAiConfigured } from "@/lib/ai";
import PageHeader from "@/components/admin/PageHeader";
import RecycleManager from "./RecycleManager";

export const dynamic = "force-dynamic";

/** Reciclaje de contenido (E4): de algo que ya hiciste salen versiones para cada red. */
export default async function RecyclePage() {
  const { t } = await getT();
  const cards = await prisma.contentCard.findMany({
    where: { caption: { not: "" } },
    orderBy: [{ views: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: 20,
    select: { id: true, caption: true, platform: true, views: true },
  });
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Contenido", "Content")}
        title={t("Reciclar con IA", "Recycle with AI")}
        description={t(
          "Pega la transcripción o el guion de un video largo, o elige una publicación que funcionó, y te preparamos ganchos, un texto para cada red y un carrusel. Tú lo revisas y lo guardas en tu banco de contenido.",
          "Paste the transcript or script of a long video, or pick a post that worked, and we'll prepare hooks, a caption for each network and a carousel. You review it and save it to your content bank."
        )}
      />
      <RecycleManager
        aiConfigured={isAiConfigured()}
        cards={cards.map((c) => ({ id: c.id, label: `${c.caption.split("\n")[0].slice(0, 70)}${c.views ? ` · ${c.views.toLocaleString("en-US")} ${t("vistas", "views")}` : ""}` }))}
      />
    </div>
  );
}
