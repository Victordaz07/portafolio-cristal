import PageHeader from "@/components/admin/PageHeader";
import PublicPreview from "./PublicPreview";
import { sessionCreatorSite } from "@/lib/site-url";

export default async function AdminPublicViewPage() {
  const site = await sessionCreatorSite();
  return (
    <div>
      <PageHeader eyebrow="Landing" title="Vista pública" />
      <PublicPreview src={site?.previewPath ?? "/"} />
    </div>
  );
}
