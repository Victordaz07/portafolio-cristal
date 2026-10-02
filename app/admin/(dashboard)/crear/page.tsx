import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { appTimeZone, todayKey } from "@/lib/growth-server";
import { isAiConfigured } from "@/lib/ai";
import { toPostView } from "@/lib/posts-view";
import Composer from "./Composer";

export default async function AdminCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; date?: string }>;
}) {
  const { id, date } = await searchParams;
  const tz = appTimeZone();
  const [brands, post] = await Promise.all([
    // Primero las marcas con trato abierto: son las más probables para una publicación.
    prisma.brand.findMany({
      where: { OR: [{ dealStatus: { in: ["active", "negotiating", "prospect"] } }, { active: true }] },
      orderBy: [{ dealStatus: "asc" }, { order: "asc" }],
      select: { id: true, name: true, dealStatus: true },
    }),
    id ? prisma.scheduledPost.findUnique({ where: { id }, include: { brand: { select: { name: true } } } }) : null,
  ]);
  const dealBrands = brands.filter((b) => b.dealStatus && b.dealStatus !== "completed");
  const otherBrands = brands.filter((b) => !dealBrands.includes(b));

  return (
    <div>
      <PageHeader eyebrow="Contenido" title={post ? "Editar publicación" : "Crear publicación"} />
      <Composer
        key={post?.id ?? "new"}
        brands={[...dealBrands, ...otherBrands].map(({ id, name }) => ({ id, name }))}
        dealBrandIds={dealBrands.map((b) => b.id)}
        initial={post ? toPostView(post, tz) : null}
        defaultDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey()}
        aiConfigured={isAiConfigured()}
        timeZone={tz}
      />
    </div>
  );
}
