import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "./SettingsForm";

export default async function AdminContactoPage() {
  const settings = await prisma.siteSettings.findFirst();

  return (
    <div>
      <PageHeader
        eyebrow="Configuración"
        title="Contacto y redes"
        description="El texto 'por qué yo', el pie de página y tus datos de contacto y redes sociales."
      />
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
