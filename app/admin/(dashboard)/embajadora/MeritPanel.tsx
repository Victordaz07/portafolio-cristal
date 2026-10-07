"use client";

import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { secondaryButtonClass } from "@/lib/admin-ui";

/** Enlace de una cuenta que aún no es embajadora y su avance hacia el nivel (G5). */
export default function MeritPanel({ link, progress }: { link: string; progress: { count: number; needed: number; left: number; reached: boolean; percent: number } }) {
  const { t } = useT();
  const { showToast } = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      showToast("success", t("Enlace copiado", "Link copied"));
    } catch {
      showToast("error", t("No se pudo copiar; selecciónalo y cópialo a mano", "Couldn't copy; select it and copy it by hand"));
    }
  }
  return (
    <>
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tu enlace", "Your link")}</p>
        <p className="break-all rounded-[12px] bg-cream px-sp-3 py-sp-2 font-mono text-sm text-ink select-all">{link}</p>
        <button type="button" onClick={copy} className={`${secondaryButtonClass} mt-sp-3`}>{t("Copiar enlace", "Copy link")}</button>
        <p className="mt-sp-3 text-xs text-ink/60">
          {t("Si compartes tu enlace por ser parte de este programa, di que lo haces por una recompensa (#publicidad o #ad).", "If you share your link as part of this program, say you do it for a reward (#ad or #publicidad).")}
        </p>
      </Card>
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tu avance", "Your progress")}</p>
        <p className="text-sm text-ink">
          {t(`${progress.count} de ${progress.needed} personas que invitaste ya pagan su plan.`, `${progress.count} of ${progress.needed} people you invited are now on a paid plan.`)}{" "}
          {!progress.reached && t(`Te faltan ${progress.left}.`, `${progress.left} to go.`)}
        </p>
        <div className="mt-sp-2 h-2 rounded-full bg-cream" role="progressbar" aria-valuenow={progress.count} aria-valuemin={0} aria-valuemax={progress.needed}>
          <div className="h-2 rounded-full bg-lime" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="mt-sp-3 text-xs text-ink/60">
          {t(
            "Al llegar a la meta tendrás Folio Pro sin pagar, una insignia para tu sitio y meses gratis por cada persona que invites y pague. Solo cuentan quienes pagan su plan; los datos de quienes se registran no los ves.",
            "When you reach the goal you'll have Folio Pro with nothing to pay, a badge for your site and free months for every person you invite who pays. Only people on a paid plan count; you don't see who signs up."
          )}
        </p>
      </Card>
    </>
  );
}
