"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/admin/AdminLang";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { mailtoLink } from "@/lib/pitch";

export interface PitchSeed {
  id: string;
  name: string;
  websiteUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  pitchOffer: string | null;
}

type Result = { subject: string; body: string; ideas: string[] };

/**
 * «Escribir propuesta» (C1): Claude escribe el correo para una marca; la persona lo copia o lo abre en su correo y lo envía ella.
 * Foliocrew no manda nada a la marca. Con `followUp` escribe el seguimiento 1 o 2 de una propuesta ya enviada.
 */
export default function PitchWriter({
  brand,
  followUp = null,
  label,
  className,
  onSaved,
}: {
  brand?: PitchSeed;
  followUp?: 1 | 2 | null;
  label?: string;
  className?: string;
  /** Recibe la marca actualizada por el servidor (propuesta guardada o seguimiento anotado). */
  onSaved: (brand: unknown) => void;
}) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [brandName, setBrandName] = useState(brand?.name ?? "");
  const [brandLink, setBrandLink] = useState(brand?.websiteUrl ?? "");
  const [contactName, setContactName] = useState(brand?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(brand?.contactEmail ?? "");
  const [offer, setOffer] = useState(brand?.pitchOffer ?? "");
  const [tone, setTone] = useState("cercano");
  const [mailLang, setMailLang] = useState<"es" | "en">(lang);
  const [busy, setBusy] = useState<null | "write" | "save">(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const field = "flex flex-col gap-sp-1 text-sm font-medium text-ink";
  const hint = "text-xs font-normal text-ink/50";

  async function write(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy("write");
    setError("");
    const response = await fetch("/api/admin/pitch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(brand ? { brandId: brand.id } : {}),
        brandName,
        brandLink: brandLink || undefined,
        contactName: contactName || undefined,
        offer,
        tone,
        lang: mailLang,
        followUp,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return setError(data.error ?? t("No se pudo escribir la propuesta", "Couldn't write the proposal"));
    setResult(data as Result);
  }

  const fullText = result ? `${result.subject}\n\n${result.body}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      showToast("success", t("Copiado", "Copied"));
    } catch {
      showToast("error", t("No se pudo copiar; selecciónalo y cópialo a mano", "Couldn't copy; select it and copy it by hand"));
    }
  }

  async function save() {
    if (!result) return;
    setBusy("save");
    const isFollowUp = Boolean(followUp && brand);
    const response = await fetch(isFollowUp ? `/api/admin/brands/${brand!.id}/pitch` : "/api/admin/pitch/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isFollowUp
          ? { action: "followup_sent" }
          : {
              ...(brand ? { brandId: brand.id } : {}),
              brandName,
              websiteUrl: /^https?:\/\//i.test(brandLink) ? brandLink : "",
              contactName,
              contactEmail,
              offer,
              subject: result.subject,
              lang: mailLang === "en" ? "en" : "es",
            }
      ),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", isFollowUp ? t("Seguimiento anotado", "Follow-up noted") : t("Guardada en tu CRM: el seguimiento cuenta desde hoy", "Saved in your CRM: the follow-up counts from today"));
    onSaved(data);
    setOpen(false);
    setResult(null);
  }

  const title = followUp ? t(`Seguimiento ${followUp}`, `Follow-up ${followUp}`) : t("Escribir propuesta", "Write a proposal");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? "text-sm font-semibold text-coral hover:underline"}>
        {label ?? t("✍️ Escribir propuesta", "✍️ Write a proposal")}
      </button>
      {open &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[90] overflow-y-auto bg-ink/60 px-sp-3 py-sp-6" onClick={() => setOpen(false)}>
            <div className="mx-auto w-full max-w-2xl rounded-[18px] bg-white p-sp-4 sm:p-sp-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-sp-3">
                <div>
                  <h3 className="font-fraunces text-2xl font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-sm text-ink/60">
                    {t(
                      "Claude escribe el correo; tú lo revisas y lo mandas desde tu propio correo. Foliocrew no envía nada a la marca.",
                      "Claude writes the email; you review it and send it from your own email. Foliocrew doesn't send anything to the brand."
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label={t("Cerrar", "Close")} className="text-xl leading-none text-ink/40 hover:text-ink">
                  ×
                </button>
              </div>

              {!result ? (
                <form onSubmit={write} className="mt-sp-4 grid gap-sp-3 sm:grid-cols-2">
                  <label className={field}>
                    {t("Marca", "Brand")}
                    <input required value={brandName} onChange={(e) => setBrandName(e.target.value)} readOnly={Boolean(brand)} maxLength={100} className={inputClass} />
                  </label>
                  <label className={field}>
                    {t("Su web o Instagram", "Their website or Instagram")}
                    <input value={brandLink} onChange={(e) => setBrandLink(e.target.value)} maxLength={300} placeholder="https://… / @marca" className={inputClass} />
                    <span className={hint}>{t("No la visitamos: ayuda a que el correo suene a esa marca.", "We don't visit it: it helps the email sound like that brand.")}</span>
                  </label>
                  <label className={field}>
                    {t("Nombre de la persona contacto (opcional)", "Contact's name (optional)")}
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={100} className={inputClass} />
                  </label>
                  <label className={field}>
                    {t("Su correo (opcional)", "Their email (optional)")}
                    <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={200} className={inputClass} />
                  </label>
                  <label className={`${field} sm:col-span-2`}>
                    {t("¿Qué quieres ofrecerles?", "What do you want to offer them?")}
                    <textarea
                      required
                      minLength={3}
                      rows={3}
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                      maxLength={1000}
                      placeholder={t("Ej.: 3 reels de rutina de skincare de noche con tu nuevo sérum", "E.g.: 3 night skincare routine reels featuring your new serum")}
                      className={inputClass}
                    />
                  </label>
                  <label className={field}>
                    {t("Tono", "Tone")}
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass}>
                      <option value="cercano">{t("Cercano", "Friendly")}</option>
                      <option value="profesional">{t("Profesional", "Professional")}</option>
                      <option value="directo">{t("Directo", "Direct")}</option>
                    </select>
                  </label>
                  <label className={field}>
                    {t("Idioma del correo", "Email language")}
                    <select value={mailLang} onChange={(e) => setMailLang(e.target.value as "es" | "en")} className={inputClass}>
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                  {error && (
                    <p role="alert" className="text-sm text-red-600 sm:col-span-2">
                      {error}
                    </p>
                  )}
                  <div className="sm:col-span-2">
                    <button type="submit" disabled={busy === "write"} className={primaryButtonClass}>
                      {busy === "write" ? t("Escribiendo…", "Writing…") : t("Escribir con IA", "Write with AI")}
                    </button>
                    <span className="ml-sp-3 text-xs text-ink/50">{t("Cuenta como 1 sugerencia de IA.", "Counts as 1 AI suggestion.")}</span>
                  </div>
                </form>
              ) : (
                <div className="mt-sp-4 flex flex-col gap-sp-3">
                  <label className={field}>
                    {t("Asunto", "Subject")}
                    <input value={result.subject} onChange={(e) => setResult({ ...result, subject: e.target.value })} className={inputClass} />
                  </label>
                  <label className={field}>
                    {t("Mensaje (puedes editarlo)", "Message (you can edit it)")}
                    <textarea value={result.body} onChange={(e) => setResult({ ...result, body: e.target.value })} rows={11} className={inputClass} />
                  </label>
                  {result.ideas.length > 0 && (
                    <div className="rounded-[12px] bg-cream p-sp-3 text-sm text-ink">
                      <p className="font-semibold">{t("Ideas de contenido para esta marca", "Content ideas for this brand")}</p>
                      <ul className="mt-1 list-disc pl-sp-5 text-ink/80">
                        {result.ideas.map((idea) => (
                          <li key={idea}>{idea}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-sp-2">
                    <button type="button" onClick={copy} className={primaryButtonClass}>
                      {t("Copiar", "Copy")}
                    </button>
                    <a href={mailtoLink(contactEmail || brand?.contactEmail, result.subject, result.body)} className={secondaryButtonClass}>
                      {t("Abrir en mi correo", "Open in my email")}
                    </a>
                    <button type="button" onClick={save} disabled={busy === "save"} className={secondaryButtonClass}>
                      {followUp && brand ? t("Ya envié el seguimiento", "I sent the follow-up") : t("Guardar en mi CRM", "Save in my CRM")}
                    </button>
                    <button type="button" onClick={() => setResult(null)} className="text-sm font-medium text-ink/60 hover:text-ink">
                      {t("← Volver a escribir", "← Write again")}
                    </button>
                  </div>
                  <p className="text-xs text-ink/55">
                    {followUp && brand
                      ? t("Cuando lo mandes desde tu correo, toca «Ya envié el seguimiento» para que Foliocrew te avise del siguiente.", "Once you've sent it from your email, tap “I sent the follow-up” so Foliocrew can remind you of the next one.")
                      : t(
                          "Guárdala cuando la envíes: la marca queda como prospecto (oculta de tu sitio público) y el seguimiento cuenta desde hoy.",
                          "Save it when you send it: the brand is kept as a prospect (hidden from your public site) and the follow-up counts from today."
                        )}
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
