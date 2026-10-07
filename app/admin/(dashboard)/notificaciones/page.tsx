import { getT } from "@/lib/admin-lang-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import PushSetup from "./PushSetup";

export const dynamic = "force-dynamic";

/** Avisos en el celular (E5): instalar el panel como app y recibir avisos aunque no esté abierto. */
export default async function NoticesPage() {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Ayuda", "Help")}
        title={t("Avisos en el celular", "Phone notices")}
        description={t(
          "Instala Foliocrew en la pantalla de inicio de tu celular y recibe un aviso cuando te pagan, vence una entrega o te responden en la comunidad, aunque no tengas el panel abierto.",
          "Install Foliocrew on your phone's home screen and get a notice when you get paid, a deliverable is due or someone replies in the community, even if the dashboard isn't open."
        )}
      />
      <PushSetup />
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cómo instalarla", "How to install it")}</p>
        <ul className="flex list-disc flex-col gap-1 pl-sp-5 text-sm text-ink/80">
          <li>{t("Android (Chrome): menú ⋮ → «Instalar app» o «Añadir a la pantalla de inicio».", "Android (Chrome): menu ⋮ → “Install app” or “Add to Home screen”.")}</li>
          <li>{t("iPhone (Safari): botón Compartir → «Añadir a pantalla de inicio». En iPhone los avisos solo funcionan desde la app instalada (iOS 16.4 o más nuevo).", "iPhone (Safari): Share button → “Add to Home Screen”. On iPhone, notices only work from the installed app (iOS 16.4 or newer).")}</li>
          <li>{t("Computadora: en Chrome o Edge, el ícono de instalar en la barra de direcciones.", "Computer: in Chrome or Edge, the install icon in the address bar.")}</li>
        </ul>
        <p className="mt-sp-3 text-xs text-ink/50">{t("Los avisos son cortos y no incluyen datos sensibles. Puedes apagarlos cuando quieras desde esta página.", "Notices are short and don't include sensitive data. You can turn them off any time from this page.")}</p>
      </Card>
    </div>
  );
}
