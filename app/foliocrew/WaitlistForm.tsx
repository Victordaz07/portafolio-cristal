"use client";

import { useState } from "react";

const NICHES = ["Belleza", "Skincare", "Moda", "Lifestyle", "Fitness", "Comida", "Mamá y familia", "Hogar", "Tecnología", "Viajes", "Mascotas", "Otro"];
const AUDIENCES = [
  { value: "0-1k", label: "Menos de 1k" },
  { value: "1k-10k", label: "1k – 10k" },
  { value: "10k-50k", label: "10k – 50k" },
  { value: "50k+", label: "Más de 50k" },
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
      setError(data.error ?? "No se pudo guardar; intenta de nuevo");
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
        <p className="font-fraunces text-2xl font-semibold">¡Ya estás en la lista! 💜</p>
        {position && <p className={`mt-sp-1 ${dark ? "text-cream/75" : "text-[#251023]/70"}`}>Tienes el puesto <strong>#{position}</strong> de la lista.</p>}
        <p className={`mt-sp-2 text-sm ${dark ? "text-cream/65" : "text-[#251023]/60"}`}>
          Te escribiremos a tu correo cuando abramos. Quienes se anotan primero entran antes y con precio especial de lanzamiento.
        </p>
        <div className="mt-sp-4 flex flex-wrap gap-sp-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl).then(() => setCopied(true))}
            className="rounded-full bg-[#B692E7] px-sp-4 py-sp-2 text-sm font-semibold text-[#251023]"
          >
            {copied ? "¡Link copiado!" : "Invita a alguien que cree contenido"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Mira Foliocrew, el portafolio para creadores de contenido y UGC: ${shareUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className={`rounded-full border px-sp-4 py-sp-2 text-sm font-semibold ${dark ? "border-cream/30" : "border-[#251023]/20"}`}
          >
            Compartir por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-3 text-left">
      <div className={`flex flex-col gap-sp-2 ${compact ? "sm:flex-row" : ""}`}>
        <label className="sr-only" htmlFor={`wl-email-${compact ? "c" : "f"}`}>Tu correo</label>
        <input
          id={`wl-email-${compact ? "c" : "f"}`}
          type="email"
          required
          autoComplete="email"
          placeholder="Tu correo"
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
            {status === "sending" ? "Guardando…" : "Unirme a la lista"}
          </button>
        )}
      </div>
      {!compact && (
        <>
          <input
            placeholder="Tu Instagram (opcional)"
            value={values.instagram}
            onChange={(e) => setValues((v) => ({ ...v, instagram: e.target.value }))}
            className={field}
            aria-label="Tu Instagram (opcional)"
          />
          <div className="grid gap-sp-2 sm:grid-cols-2">
            <select value={values.niche} onChange={(e) => setValues((v) => ({ ...v, niche: e.target.value }))} className={field} aria-label="Tu nicho">
              <option value="">Tu nicho (opcional)</option>
              {NICHES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <select value={values.audience} onChange={(e) => setValues((v) => ({ ...v, audience: e.target.value }))} className={field} aria-label="Tus seguidores">
              <option value="">Tus seguidores (opcional)</option>
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-[#7F207B] px-sp-5 py-sp-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "sending" ? "Guardando…" : "Quiero mi lugar en la lista"}
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
      <p className={`text-xs ${dark ? "text-cream/45" : "text-[#251023]/45"}`}>Sin spam. Solo te escribimos para avisarte cuando abramos.</p>
    </form>
  );
}
