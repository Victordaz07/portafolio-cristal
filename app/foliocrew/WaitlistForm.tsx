"use client";

import { useState } from "react";
import { useT } from "@/components/admin/AdminLang";

// El valor guardado es siempre el nombre en español (así se agrupa en el panel); la etiqueta sigue el idioma.
const NICHES = [
  ["Belleza", "Beauty"],
  ["Skincare", "Skincare"],
  ["Moda", "Fashion"],
  ["Lifestyle", "Lifestyle"],
  ["Fitness", "Fitness"],
  ["Comida", "Food"],
  ["Mamá y familia", "Mom & family"],
  ["Hogar", "Home"],
  ["Tecnología", "Tech"],
  ["Viajes", "Travel"],
  ["Mascotas", "Pets"],
  ["Otro", "Other"],
];
const AUDIENCES = [
  { value: "0-1k", label: "Menos de 1k", labelEn: "Under 1k" },
  { value: "1k-10k", label: "1k – 10k", labelEn: "1k – 10k" },
  { value: "10k-50k", label: "10k – 50k", labelEn: "10k – 50k" },
  { value: "50k+", label: "Más de 50k", labelEn: "Over 50k" },
];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export interface Utm {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export default function WaitlistForm({ utm, compact = false, dark = false }: { utm: Utm; compact?: boolean; dark?: boolean }) {
  const { t, lang } = useT();
  const [values, setValues] = useState({ email: "", instagram: "", niche: "", audience: "", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [position, setPosition] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        audience: values.audience || null,
        ...utm,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? t("No se pudo guardar; intenta de nuevo", "Couldn't save; please try again"));
      setStatus("idle");
      return;
    }
    setPosition(data.position ?? null);
    setStatus("done");
    window.fbq?.("track", "Lead");
  }

  const field = dark
    ? "w-full rounded-full border border-cream/20 bg-cream/10 px-sp-4 py-sp-3 text-cream placeholder:text-cream/45 outline-none focus:border-[#B692E7]"
    : "w-full rounded-full border border-[#251023]/15 bg-white px-sp-4 py-sp-3 text-[#251023] placeholder:text-[#251023]/40 outline-none focus:border-[#7F207B]";

  if (status === "done") {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?utm_source=referido` : "";
    return (
      <div className={`rounded-[22px] p-sp-5 text-left ${dark ? "bg-cream/10 text-cream" : "bg-white text-[#251023] shadow-[0_8px_30px_rgba(37,16,35,0.08)]"}`} role="status">
        <p className="font-fraunces text-2xl font-semibold">{t("¡Ya estás en la lista! 💜", "You're on the list! 💜")}</p>
        {position && (
          <p className={`mt-sp-1 ${dark ? "text-cream/75" : "text-[#251023]/70"}`}>
            {t("Tienes el puesto", "You're")} <strong>#{position}</strong> {t("de la lista.", "on the list.")}
          </p>
        )}
        <p className={`mt-sp-2 text-sm ${dark ? "text-cream/65" : "text-[#251023]/60"}`}>
          {t(
            "Te escribiremos a tu correo cuando abramos. Quienes se anotan primero entran antes y con precio especial de lanzamiento.",
            "We'll email you when we open. Early sign-ups get in sooner and at a special launch price."
          )}
        </p>
        <div className="mt-sp-4 flex flex-wrap gap-sp-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl).then(() => setCopied(true))}
            className="rounded-full bg-[#B692E7] px-sp-4 py-sp-2 text-sm font-semibold text-[#251023]"
          >
            {copied ? t("¡Link copiado!", "Link copied!") : t("Invita a alguien que cree contenido", "Invite someone who creates content")}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              t(`Mira Foliocrew, el portafolio para creadores de contenido y UGC: ${shareUrl}`, `Check out Foliocrew, the portfolio for content and UGC creators: ${shareUrl}`)
            )}`}
            target="_blank"
            rel="noreferrer"
            className={`rounded-full border px-sp-4 py-sp-2 text-sm font-semibold ${dark ? "border-cream/30" : "border-[#251023]/20"}`}
          >
            {t("Compartir por WhatsApp", "Share on WhatsApp")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-3 text-left">
      <div className={`flex flex-col gap-sp-2 ${compact ? "sm:flex-row" : ""}`}>
        <label className="sr-only" htmlFor={`wl-email-${compact ? "c" : "f"}`}>
          {t("Tu correo", "Your email")}
        </label>
        <input
          id={`wl-email-${compact ? "c" : "f"}`}
          type="email"
          required
          autoComplete="email"
          placeholder={t("Tu correo", "Your email")}
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className={field}
        />
        {compact && (
          <button
            type="submit"
            disabled={status === "sending"}
            className="shrink-0 rounded-full bg-[#7F207B] px-sp-5 py-sp-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "sending" ? t("Guardando…", "Saving…") : t("Unirme a la lista", "Join the waitlist")}
          </button>
        )}
      </div>
      {!compact && (
        <>
          <input
            placeholder={t("Tu Instagram (opcional)", "Your Instagram (optional)")}
            value={values.instagram}
            onChange={(e) => setValues((v) => ({ ...v, instagram: e.target.value }))}
            className={field}
            aria-label={t("Tu Instagram (opcional)", "Your Instagram (optional)")}
          />
          <div className="grid gap-sp-2 sm:grid-cols-2">
            <select value={values.niche} onChange={(e) => setValues((v) => ({ ...v, niche: e.target.value }))} className={field} aria-label={t("Tu nicho", "Your niche")}>
              <option value="">{t("Tu nicho (opcional)", "Your niche (optional)")}</option>
              {NICHES.map(([es, en]) => (
                <option key={es} value={es}>
                  {lang === "en" ? en : es}
                </option>
              ))}
            </select>
            <select value={values.audience} onChange={(e) => setValues((v) => ({ ...v, audience: e.target.value }))} className={field} aria-label={t("Tus seguidores", "Your followers")}>
              <option value="">{t("Tus seguidores (opcional)", "Your followers (optional)")}</option>
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {lang === "en" ? a.labelEn : a.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-[#7F207B] px-sp-5 py-sp-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "sending" ? t("Guardando…", "Saving…") : t("Quiero mi lugar en la lista", "Save my spot")}
          </button>
        </>
      )}
      {/* Campo trampa para bots: oculto para las personas. */}
      <input
        tabIndex={-1}
        autoComplete="off"
        value={values.website}
        onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
        className="hidden"
        aria-hidden
        name="website"
      />
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <p className={`text-xs ${dark ? "text-cream/45" : "text-[#251023]/45"}`}>
        {t("Sin spam. Solo te escribimos para avisarte cuando abramos.", "No spam. We only email you when we open.")}
      </p>
    </form>
  );
}
