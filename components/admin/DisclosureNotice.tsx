"use client";

import { useT } from "@/components/admin/AdminLang";
import type { PlanNetwork } from "@/lib/content-plan";
import { addDisclosure, brandedContentTools, checkDisclosure, moveDisclosureToStart, suggestedTag } from "@/lib/disclosure";

/**
 * Aviso de publicidad para una publicación que es para una marca: revisa que el texto lo diga y que se vea
 * antes del «ver más», con un botón para arreglarlo. No bloquea nada: es una ayuda, no asesoría legal.
 */
export default function DisclosureNotice({
  caption,
  networks,
  onChange,
  aiUsed,
}: {
  caption: string;
  networks: PlanNetwork[];
  onChange: (caption: string) => void;
  /** El caption lo escribió (o ayudó a escribir) la IA. */
  aiUsed: boolean;
}) {
  const { t, lang } = useT();
  const check = checkDisclosure(caption, networks);
  const tag = suggestedTag(lang);
  const tools = brandedContentTools(networks, lang);

  const problem =
    check.status === "missing"
      ? {
          text: t(
            `Esta publicación es para una marca, pero el texto no dice que es publicidad. Agrega ${tag} al inicio para que se vea antes del «ver más».`,
            `This post is for a brand, but the text doesn't say it's an ad. Add ${tag} at the start so it shows before “more”.`
          ),
          button: t(`Agregar ${tag} al inicio`, `Add ${tag} at the start`),
          fix: () => onChange(addDisclosure(caption, lang)),
        }
      : check.status === "late"
        ? {
            text: t(
              `El aviso de publicidad queda muy abajo: en ${networks.length > 1 ? "algunas redes" : "la red"} solo se ven los primeros ${check.window} caracteres antes del «ver más». Muévelo al inicio.`,
              `The ad disclosure is too far down: ${networks.length > 1 ? "on some networks" : "on this network"} only the first ${check.window} characters show before “more”. Move it to the start.`
            ),
            button: t("Mover el aviso al inicio", "Move the disclosure to the start"),
            fix: () => onChange(moveDisclosureToStart(caption, lang)),
          }
        : check.status === "weak"
          ? {
              text: t(
                `#colaboración o #collab solos no dejan claro que hay un pago o un acuerdo. Usa ${tag} (o #patrocinado) al inicio.`,
                `#collab or #colaboración alone don't make clear there's a payment or deal. Use ${tag} (or #sponsored) at the start.`
              ),
              button: t(`Agregar ${tag} al inicio`, `Add ${tag} at the start`),
              fix: () => onChange(addDisclosure(caption, lang)),
            }
          : null;

  return (
    <div className="flex flex-col gap-sp-2" role="status">
      {problem ? (
        <div className="flex flex-col gap-sp-2 rounded-[14px] border border-coral/40 bg-coral/10 p-sp-3 text-[13px] text-ink">
          <p>
            <strong>{t("⚠ Aviso de publicidad", "⚠ Ad disclosure")}</strong> · {problem.text}
          </p>
          <div>
            <button type="button" onClick={problem.fix} className="rounded-full bg-ink px-sp-4 py-1.5 text-xs font-semibold text-cream hover:bg-coral">
              {problem.button}
            </button>
          </div>
        </div>
      ) : check.status === "ok" ? (
        <p className="rounded-[14px] bg-lime/25 px-sp-3 py-sp-2 text-[13px] text-moss">{t("✓ El aviso de publicidad se ve desde el inicio.", "✓ The ad disclosure shows from the start.")}</p>
      ) : null}

      {tools.length > 0 && (
        <details className="rounded-[14px] border border-line bg-white px-sp-3 py-sp-2 text-[13px] text-ink/80">
          <summary className="cursor-pointer font-semibold text-ink">{t("Usa también la herramienta de cada red", "Also use each network's tool")}</summary>
          <ul className="mt-sp-2 flex flex-col gap-1">
            {tools.map((x) => (
              <li key={x.network}>
                <strong>{x.label}:</strong> {x.tip}
              </li>
            ))}
          </ul>
          <p className="mt-sp-2 text-xs text-ink/55">{t("Ayudan, pero no reemplazan el aviso en el texto.", "They help, but they don't replace the disclosure in the text.")}</p>
        </details>
      )}

      {aiUsed && (
        <p className="rounded-[14px] bg-cream px-sp-3 py-sp-2 text-xs text-ink/70">
          {t(
            "🤖 Usaste IA para el texto. Si la imagen, el video o la voz también están hechos o muy editados con IA y parecen reales, activa la etiqueta «Hecho con IA» de la red.",
            "🤖 You used AI for the text. If the image, video or voice are also made or heavily edited with AI and look real, turn on the network's “Made with AI” label."
          )}
        </p>
      )}
      <p className="text-[11px] text-ink/45">
        {t("Guía de referencia (FTC de EE. UU.): el aviso debe ser claro y verse sin tocar «ver más». No es asesoría legal.", "Reference guide (US FTC): the disclosure must be clear and visible without tapping “more”. Not legal advice.")}
      </p>
    </div>
  );
}
