import PageHeader from "@/components/admin/PageHeader";
import PublicPreview from "./PublicPreview";

export default function AdminPublicViewPage() {
  return (
    <div>
      <PageHeader eyebrow="Landing" title="Vista pública" />
      <PublicPreview />
    </div>
  );
}
