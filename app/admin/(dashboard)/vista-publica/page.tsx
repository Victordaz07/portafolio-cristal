import PageHeader from "@/components/admin/PageHeader";
import PublicPreview from "./PublicPreview";
import { sessionCreatorSite } from "@/lib/site-url";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminPublicViewPage() {
  const { t } = await getT();
  const site = await sessionCreatorSite();
  return (
    <div>
      <PageHeader eyebrow={t("Landing", "Landing page")} title={t("Vista pública", "Public view")} />
      <PublicPreview src={site?.previewPath ?? "/"} />
    </div>
  );
}
