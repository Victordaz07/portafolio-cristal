import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "./SettingsForm";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminContactoPage() {
  const { t } = await getT();
  const settings = await prisma.siteSettings.findFirst();

  return (
    <div>
      <PageHeader
        eyebrow={t("Configuración", "Settings")}
        title={t("Contacto y redes", "Contact & social")}
        description={t("El texto 'por qué yo', el pie de página y tus datos de contacto y redes sociales.", "The 'why me' text, the footer, and your contact details and social accounts.")}
      />
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
