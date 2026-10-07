"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";
import { MAX_COMMENT, PAYMENT_OPTIONS } from "@/lib/brand-reviews";

interface Brand {
  id: string;
  name: string;
  key: string;
  review: { payment: string; payDays: number | null; rating: number; comment: string; commentStatus: string } | null;
}

/** Formulario para reseñar (o corregir la reseña de) una de tus marcas. */
export default function BrandReviewForm({ brands }: { brands: Brand[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [brandId, setBrandId] = useState(brands[0].id);
  const brand = brands.find((b) => b.id === brandId) ?? brands[0];
  const [payment, setPayment] = useState(brand.review?.payment ?? "on_time");
  const [payDays, setPayDays] = useState(brand.review?.payDays != null ? String(brand.review.payDays) : "");
  const [rating, setRating] = useState(brand.review?.rating ?? 5);
  const [comment, setComment] = useState(brand.review?.comment ?? "");
  const [busy, setBusy] = useState(false);

  function pick(id: string) {
    const next = brands.find((b) => b.id === id) ?? brands[0];
    setBrandId(id);
    setPayment(next.review?.payment ?? "on_time");
    setPayDays(next.review?.payDays != null ? String(next.review.payDays) : "");
    setRating(next.review?.rating ?? 5);
    setComment(next.review?.comment ?? "");
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const days = payDays.trim() === "" || payment === "unpaid" ? null : Number(payDays);
    const response = await fetch("/api/admin/brand-reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandId, payment, payDays: days, rating, comment }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", t("Gracias: tu reseña quedó guardada, de forma anónima", "Thanks: your review was saved, anonymously"));
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(t("¿Borrar tu reseña de esta marca?", "Delete your review of this brand?"))) return;
    setBusy(true);
    const response = await fetch(`/api/admin/brand-reviews?brandKey=${encodeURIComponent(brand.key)}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) return showToast("error", t("No se pudo borrar", "Couldn't delete"));
    showToast("success", t("Reseña borrada", "Review deleted"));
    router.refresh();
  }

  const label = "flex flex-col gap-sp-1 text-xs font-medium text-ink";
  const status = brand.review?.commentStatus;
  return (
    <form onSubmit={send} className="grid gap-sp-3 sm:grid-cols-2">
      <label className={`${label} sm:col-span-2`}>
        {t("Marca", "Brand")}
        <select value={brandId} onChange={(e) => pick(e.target.value)} className={inputClass}>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.review ? ` ✓` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        {t("¿Te pagó?", "Did they pay you?")}
        <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputClass}>
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{lang === "en" ? o.labelEn : o.label}</option>
          ))}
        </select>
      </label>
      {payment !== "unpaid" && (
        <label className={label}>
          {t("¿Cuántos días tardó el pago? (opcional)", "How many days did payment take? (optional)")}
          <input type="number" min={0} max={365} value={payDays} onChange={(e) => setPayDays(e.target.value)} className={inputClass} />
        </label>
      )}
      <label className={label}>
        {t("¿Cómo fue el trato? (1 a 5)", "How was the deal? (1 to 5)")}
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={inputClass}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
          ))}
        </select>
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("Comentario (opcional)", "Comment (optional)")}
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={MAX_COMMENT} className={inputClass} placeholder={t("Cuenta hechos: plazos, cambios de última hora, comunicación… Sin insultos ni acusaciones, ni correos, teléfonos o enlaces.", "Stick to facts: timelines, last-minute changes, communication… No insults or accusations, and no emails, phone numbers or links.")} />
        <span className="font-normal text-ink/50">
          {comment.length}/{MAX_COMMENT} · {t("El equipo lo revisa antes de mostrarlo.", "The team reviews it before it's shown.")}
          {status === "pending" && ` ${t("Tu comentario actual está en revisión.", "Your current comment is under review.")}`}
          {status === "approved" && ` ${t("Tu comentario actual ya se muestra.", "Your current comment is shown.")}`}
          {status === "hidden" && ` ${t("Tu comentario actual no se muestra: no cumplió las reglas.", "Your current comment isn't shown: it didn't meet the rules.")}`}
        </span>
      </label>
      <div className="flex items-center gap-sp-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {brand.review ? t("Guardar cambios", "Save changes") : t("Enviar reseña", "Submit review")}
        </button>
        {brand.review && (
          <button type="button" onClick={remove} disabled={busy} className="text-sm text-red-600/70 hover:text-red-600">
            {t("Borrar mi reseña", "Delete my review")}
          </button>
        )}
      </div>
    </form>
  );
}
