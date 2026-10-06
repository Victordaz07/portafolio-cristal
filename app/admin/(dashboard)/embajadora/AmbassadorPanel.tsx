"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { plural } from "@/lib/admin-lang";
import { secondaryButtonClass } from "@/lib/admin-ui";
import type { KitText } from "@/lib/ambassador-kit";

export default function AmbassadorPanel({
  link,
  code,
  badge,
  stats,
  kit,
  rules,
}: {
  link: string;
  code: string;
  badge: boolean;
  stats: { registered: number; paying: number; months: number };
  kit: KitText[];
  rules: string[];
}) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", t(`${what} copiado`, `${what} copied`));
    } catch {
      showToast("error", t("No se pudo copiar; selecciónalo y cópialo a mano", "Couldn't copy; select it and copy it by hand"));
    }
  }

  async function toggleBadge() {
    setBusy(true);
    const response = await fetch("/api/admin/ambassador", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge: !badge }),
    });
    setBusy(false);
    if (!response.ok) return showToast("error", t("No se pudo cambiar", "Couldn't change it"));
    showToast("success", badge ? t("Insignia oculta", "Badge hidden") : t("Insignia visible", "Badge visible"));
    router.refresh();
  }

  const figures: [number, string][] = [
    [stats.registered, plural(lang, stats.registered, ["persona se registró", "personas se registraron"], ["person signed up", "people signed up"]).replace(/^\d+ /, "")],
    [stats.paying, plural(lang, stats.paying, ["ya paga", "ya pagan"], ["pays", "pay"]).replace(/^\d+ /, "")],
    [stats.months, plural(lang, stats.months, ["mes gratis ganado", "meses gratis ganados"], ["free month earned", "free months earned"]).replace(/^\d+ /, "")],
  ];

  return (
    <>
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tu enlace", "Your link")}</p>
        <p className="break-all rounded-[12px] bg-cream px-sp-3 py-sp-2 font-mono text-sm text-ink select-all">{link}</p>
        <div className="mt-sp-3 flex flex-wrap items-center gap-sp-2">
          <button type="button" onClick={() => copy(link, t("Enlace", "Link"))} className="rounded-full bg-ink px-sp-4 py-1.5 text-xs font-semibold text-cream hover:bg-coral">
            {t("Copiar enlace", "Copy link")}
          </button>
          <button type="button" onClick={() => copy(code, t("Código", "Code"))} className={secondaryButtonClass}>
            {t(`Copiar código (${code})`, `Copy code (${code})`)}
          </button>
        </div>
        <p className="mt-sp-3 text-xs text-ink/60">
          {t(
            "Quien abra tu enlace puede crear su cuenta sin código de invitación. Tu código no cambia aunque cambies el nombre de tu sitio.",
            "Anyone who opens your link can create an account without an invite code. Your code doesn't change even if you rename your site."
          )}
        </p>
      </Card>

      <div className="grid gap-sp-3 sm:grid-cols-3">
        {figures.map(([n, label]) => (
          <Card key={label}>
            <p className="font-fraunces text-4xl font-semibold text-ink">{n}</p>
            <p className="mt-1 text-sm text-ink/65">{label}</p>
          </Card>
        ))}
      </div>
      <p className="-mt-sp-2 text-xs text-ink/55">
        {t("Solo ves cantidades: nunca los nombres ni los correos de quien se registra.", "You only see counts: never the names or emails of who signs up.")}
      </p>

      <Card>
        <p className="mb-sp-1 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Kit para compartir", "Sharing kit")}</p>
        <p className="mb-sp-3 rounded-[12px] bg-coral/10 px-sp-3 py-sp-2 text-[13px] text-ink">
          <strong>{t("Recuerda:", "Remember:")}</strong>{" "}
          {t(
            "como ganas meses gratis por invitar, tienes que decir que eres embajadora y que es publicidad (#publicidad o #ad), al inicio del texto para que se vea antes del «ver más». Estos textos ya lo hacen.",
            "since you earn free months for inviting people, you have to say you're an ambassador and that it's an ad (#ad or #publicidad), at the start of the text so it shows before “more”. These texts already do."
          )}
        </p>
        <ul className="flex flex-col gap-sp-3">
          {kit.map((item) => (
            <li key={item.id} className="rounded-[14px] border border-line p-sp-3">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink/80">{item.text}</p>
              <button type="button" onClick={() => copy(item.text, t("Texto", "Text"))} className={`${secondaryButtonClass} mt-sp-2`}>
                {t("Copiar texto", "Copy text")}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Insignia en tu sitio", "Badge on your site")}</p>
        <p className="text-sm text-ink/80">
          {t(
            "En el pie de tu sitio público aparece «Foliocrew Ambassador», que lleva a tu enlace. Puedes ocultarla cuando quieras.",
            "In your public site's footer a “Foliocrew Ambassador” badge shows, linking to your link. You can hide it any time."
          )}
        </p>
        <button type="button" disabled={busy} onClick={toggleBadge} className={`${secondaryButtonClass} mt-sp-3`}>
          {badge ? t("Ocultar insignia", "Hide badge") : t("Mostrar insignia", "Show badge")}
        </button>
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cómo funciona", "How it works")}</p>
        <ul className="flex list-disc flex-col gap-sp-2 pl-sp-5 text-sm text-ink/80">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="mt-sp-3 text-sm text-ink/70">
          {t("¿Dudas o ideas para el programa? Escríbenos desde ", "Questions or ideas for the program? Write to us from ")}
          <a href="/admin/soporte" className="font-semibold text-coral hover:underline">
            {t("Soporte", "Support")}
          </a>
          .
        </p>
      </Card>
    </>
  );
}
