"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { t, type Locale } from "@/lib/i18n";

/**
 * «Solicitar este paquete» (C2): botón + ventana con el formulario. Envía a /api/package-request, que crea el trato en el CRM
 * de la creadora y le avisa. Tiene un campo trampa oculto (`website`) para frenar bots.
 */
export default function PackageRequest({
  locale,
  packageId,
  packageName,
  price,
  currency,
  endpoint = "/api/package-request",
}: {
  locale: Locale;
  packageId: string;
  packageName: string;
  price: string | null;
  currency: string;
  /** En la dirección provisional /s/<slug> el envío va a /s/<slug>/api/package-request. */
  endpoint?: string;
}) {
  const copy = t(locale).packageRequest;
  const buttonLabel = t(locale).paquetes.solicitar;
  const [open, setOpen] = useState(false);
  // La ventana se monta dentro del contenedor del sitio (.site) para heredar los colores y tipografías de la creadora.
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ brandName: "", contactName: "", email: "", startDate: "", endDate: "", budget: "", brief: "", website: "" });

  useEffect(() => {
    if (!open) return;
    setHost(document.querySelector<HTMLElement>(".site") ?? document.body);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const field = "flex flex-col gap-sp-1 text-sm font-medium text-ink";
  const input = "rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId,
        brandName: form.brandName,
        contactName: form.contactName,
        email: form.email,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: form.budget.trim() ? Math.round(Number(form.budget)) : null,
        brief: form.brief,
        website: form.website,
        lang: locale,
      }),
    });
    if (response.ok) return setStatus("success");
    const data = await response.json().catch(() => ({}));
    setStatus("error");
    setError(data.error ?? copy.errorFallback);
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setStatus("idle"); }} className="r-btn w-full bg-ink px-sp-4 py-sp-3 text-sm font-medium text-cream transition hover:bg-coral">
        {buttonLabel}
      </button>
      {open && host &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label={copy.title} className="fixed inset-0 z-[90] overflow-y-auto bg-ink/60 px-sp-3 py-sp-6" onClick={() => setOpen(false)}>
            <div className="mx-auto w-full max-w-lg r-sm bg-surface p-sp-5 text-left" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-sp-3">
                <div>
                  <h3 className="site-title text-xl text-ink">{copy.title}</h3>
                  <p className="mt-1 text-sm text-ink/70">
                    {copy.package}: <strong>{packageName}</strong>
                    {price ? ` · ${price}` : ""}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label={copy.cerrar} className="text-xl leading-none text-ink/40 hover:text-ink">
                  ×
                </button>
              </div>

              {status === "success" ? (
                <div className="mt-sp-5 r-sm border border-sage p-sp-5 text-center">
                  <p className="site-title text-lg text-ink">{copy.successTitle}</p>
                  <p className="mt-sp-2 text-ink/70">{copy.successBody}</p>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-sp-4 flex flex-col gap-sp-3">
                  <div className="grid gap-sp-3 sm:grid-cols-2">
                    <label className={field}>
                      {copy.marca}
                      <input required maxLength={120} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} className={input} />
                    </label>
                    <label className={field}>
                      {copy.contacto}
                      <input required maxLength={120} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} autoComplete="name" className={input} />
                    </label>
                  </div>
                  <label className={field}>
                    {copy.email}
                    <input type="email" required maxLength={200} value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={input} />
                  </label>
                  <div className="grid gap-sp-3 sm:grid-cols-2">
                    <label className={field}>
                      {copy.inicio}
                      <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={input} />
                    </label>
                    <label className={field}>
                      {copy.entrega}
                      <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} className={input} />
                    </label>
                  </div>
                  <label className={field}>
                    {copy.presupuesto} ({currency})
                    <input type="number" inputMode="numeric" min={0} max={1000000} step={1} value={form.budget} onChange={(e) => set("budget", e.target.value)} className={input} />
                  </label>
                  <label className={field}>
                    {copy.brief}
                    <textarea required rows={4} maxLength={3000} value={form.brief} onChange={(e) => set("brief", e.target.value)} placeholder={copy.briefHint} className={input} />
                  </label>
                  {/* Campo trampa: las personas no lo ven; los bots suelen llenarlo. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Website
                      <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} />
                    </label>
                  </div>
                  {status === "error" && (
                    <p role="alert" className="text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={status === "loading"} className="r-btn bg-coral py-sp-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60">
                    {status === "loading" ? copy.enviando : copy.enviar}
                  </button>
                </form>
              )}
            </div>
          </div>,
          host
        )}
    </>
  );
}
