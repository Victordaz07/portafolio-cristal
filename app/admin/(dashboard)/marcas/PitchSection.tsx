"use client";

import { useT } from "@/components/admin/AdminLang";
import { formatShortDate } from "@/lib/crm";
import { pitchState } from "@/lib/pitch";
import { secondaryButtonClass } from "@/lib/admin-ui";
import PitchWriter, { type PitchSeed } from "./PitchWriter";

const eyebrowClass = "font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55";

/** Estado de la propuesta de una marca (C1) y lo que toca hacer: escribir el seguimiento, anotarlo o marcar que respondió. */
export default function PitchSection({
  brand,
  onRequest,
  onSaved,
}: {
  brand: PitchSeed & { dealStatus: string | null; pitchSentAt: string | null; pitchFollowUps: number; pitchRepliedAt: string | null };
  onRequest: (url: string, method: string, body?: unknown) => Promise<boolean>;
  onSaved: (brand: unknown) => void;
}) {
  const { t, lang } = useT();
  const state = pitchState(brand);

  if (state.phase === "none") {
    // Sin propuesta en curso: solo se ofrece escribirla para los prospectos o marcas sin trato.
    if (brand.dealStatus && brand.dealStatus !== "prospect") return null;
    return (
      <div>
        <p className={eyebrowClass}>{t("Propuesta", "Proposal")}</p>
        <div className="mt-sp-2">
          <PitchWriter brand={brand} onSaved={onSaved} className={secondaryButtonClass} />
        </div>
      </div>
    );
  }

  const sent = brand.pitchSentAt ? formatShortDate(brand.pitchSentAt, lang) : "";
  const message =
    state.phase === "replied"
      ? t(`Propuesta enviada el ${sent}: la marca respondió. 🎉`, `Proposal sent on ${sent}: the brand replied. 🎉`)
      : state.phase === "followup-due"
        ? t(`Propuesta enviada el ${sent} (hace ${state.daysSince} días) sin respuesta: toca el seguimiento ${state.followUpNumber}.`, `Proposal sent on ${sent} (${state.daysSince} days ago) with no reply: time for follow-up ${state.followUpNumber}.`)
        : state.phase === "waiting"
          ? t(
              `Propuesta enviada el ${sent}. El seguimiento ${brand.pitchFollowUps + 1} toca el ${formatShortDate(state.nextFollowUpAt!, lang)}.`,
              `Proposal sent on ${sent}. Follow-up ${brand.pitchFollowUps + 1} is due on ${formatShortDate(state.nextFollowUpAt!, lang)}.`
            )
          : t(`Propuesta enviada el ${sent} y 2 seguimientos sin respuesta. Decide si cerrarlo.`, `Proposal sent on ${sent} and 2 follow-ups with no reply. Decide whether to close it.`);

  return (
    <div>
      <p className={eyebrowClass}>{t("Propuesta", "Proposal")}</p>
      <p className={`mt-sp-2 text-[13px] ${state.phase === "followup-due" ? "font-semibold text-coral" : "text-ink"}`}>{message}</p>
      {state.phase !== "replied" && (
        <div className="mt-sp-2 flex flex-wrap items-center gap-sp-2">
          {state.phase === "followup-due" && state.followUpNumber && (
            <PitchWriter brand={brand} followUp={state.followUpNumber} label={t(`✍️ Escribir seguimiento ${state.followUpNumber}`, `✍️ Write follow-up ${state.followUpNumber}`)} onSaved={onSaved} className={secondaryButtonClass} />
          )}
          <button type="button" onClick={() => onRequest(`/api/admin/brands/${brand.id}/pitch`, "POST", { action: "replied" })} className={secondaryButtonClass}>
            {t("Respondieron", "They replied")}
          </button>
        </div>
      )}
    </div>
  );
}
