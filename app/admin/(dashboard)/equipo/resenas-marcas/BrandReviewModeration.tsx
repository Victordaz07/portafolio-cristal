"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import { MAX_REPLY } from "@/lib/brand-reviews";

interface Pending {
  id: string;
  brandName: string;
  payment: string;
  rating: number;
  comment: string;
}
interface BrandRow {
  key: string;
  name: string;
  count: number;
  reply: string;
}

/** Aprobar u ocultar comentarios, y agregar la respuesta de una marca. */
export default function BrandReviewModeration({ pending, brands, minReviews }: { pending: Pending[]; brands: BrandRow[]; minReviews: number }) {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [brandKey, setBrandKey] = useState(brands[0]?.key ?? "");
  const [reply, setReply] = useState(brands[0]?.reply ?? "");

  async function call(url: string, method: string, body: object, ok: string) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", ok);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-sp-5">
      {pending.length === 0 ? (
        <p className="text-sm text-ink/60">{t("No hay comentarios por revisar.", "There are no comments to review.")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {pending.map((p) => (
            <li key={p.id} className="flex flex-col gap-sp-2 py-sp-3 text-sm">
              <p className="text-ink">
                <span className="font-semibold">{p.brandName}</span> · {"★".repeat(p.rating)} · {p.payment}
              </p>
              <p className="whitespace-pre-line rounded-[10px] bg-cream px-sp-3 py-sp-2 text-xs text-ink/80">{p.comment}</p>
              <div className="flex gap-sp-2">
                <button type="button" disabled={busy} onClick={() => call(`/api/admin/team/brand-reviews/${p.id}`, "PATCH", { action: "approve" }, t("Comentario aprobado", "Comment approved"))} className={secondaryButtonClass}>
                  {t("Aprobar", "Approve")}
                </button>
                <button type="button" disabled={busy} onClick={() => call(`/api/admin/team/brand-reviews/${p.id}`, "PATCH", { action: "hide" }, t("Comentario oculto", "Comment hidden"))} className="rounded-full border border-line px-sp-4 py-sp-2.5 text-sm font-medium text-red-600/80 hover:border-red-300">
                  {t("Ocultar", "Hide")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-line pt-sp-4">
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Derecho de respuesta de una marca", "A brand's right of reply")}</p>
        {brands.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Todavía no hay reseñas.", "There are no reviews yet.")}</p>
        ) : (
          <div className="flex flex-col gap-sp-2">
            <select
              value={brandKey}
              onChange={(e) => {
                setBrandKey(e.target.value);
                setReply(brands.find((b) => b.key === e.target.value)?.reply ?? "");
              }}
              className={inputClass}
            >
              {brands.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.name} ({b.count} {b.count < minReviews ? t("· aún no visible", "· not visible yet") : ""})
                </option>
              ))}
            </select>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} maxLength={MAX_REPLY} className={inputClass} placeholder={t("Texto que envió la marca (sin correos, teléfonos ni enlaces)", "Text the brand sent (no emails, phone numbers or links)")} />
            <div className="flex gap-sp-2">
              <button type="button" disabled={busy || !brandKey} onClick={() => call("/api/admin/team/brand-reviews/reply", "PUT", { brandKey, text: reply }, reply.trim() ? t("Respuesta guardada", "Reply saved") : t("Respuesta borrada", "Reply deleted"))} className={secondaryButtonClass}>
                {reply.trim() ? t("Guardar respuesta", "Save reply") : t("Borrar respuesta", "Delete reply")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
