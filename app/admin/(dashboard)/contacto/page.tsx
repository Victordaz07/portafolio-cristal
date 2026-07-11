import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export default async function AdminContactoPage() {
  const settings = await prisma.siteSettings.findFirst();

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-6">
        Contacto y redes
      </h1>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
