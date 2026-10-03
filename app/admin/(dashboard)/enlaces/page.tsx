import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { sessionCreatorSite } from "@/lib/site-url";
import LinksManager from "./LinksManager";

export default async function AdminLinksPage() {
  const [links, site] = await Promise.all([prisma.bioLink.findMany({ orderBy: { order: "asc" } }), sessionCreatorSite()]);
  const base = (site?.url ?? "").replace(/\/$/, "");

  return (
    <div>
      <PageHeader
        eyebrow="Landing"
        title="Link en bio"
        description="Tu página corta para la bio de Instagram y TikTok: portafolio, media kit, contacto, tu contenido reciente y los enlaces que quieras. Usa el mismo diseño de tu sitio."
      />
      <LinksManager initialLinks={links} pageUrl={`${base}/enlaces`} previewPath={`${site?.previewPath ?? ""}/enlaces`} />
    </div>
  );
}
