"use client";

import { useState } from "react";
import { useT } from "@/components/admin/AdminLang";
import { pickLabel } from "@/lib/admin-lang";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import { dateToInput, dueLabel, daysUntil, formatShortDate } from "@/lib/crm";
import { DELIVERABLE_NETWORKS, DELIVERABLE_STATUSES, DELIVERABLE_STATUS_META, NETWORK_LABEL, isDeliverableDone, type DeliverableStatus } from "@/lib/deliverables";

export type DeliverableRow = {
  id: string;
  title: string;
  network: string | null;
  dueAt: string | null;
  status: string;
  proofUrl: string | null;
};

const eyebrowClass = "font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55";

/** Lista de lo que hay que entregarle a la marca: estado, fecha, enlace y orden. */
export default function DeliverablesSection({
  brandId,
  deliverables,
  onRequest,
}: {
  brandId: string;
  deliverables: DeliverableRow[];
  /** Llama a la API y reemplaza la marca con la respuesta. true si salió bien. */
  onRequest: (url: string, method: string, body?: unknown) => Promise<boolean>;
}) {
  const { t, lang } = useT();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [network, setNetwork] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingProof, setEditingProof] = useState<string | null>(null);
  const [proof, setProof] = useState("");

  const done = deliverables.filter((d) => isDeliverableDone(d.status)).length;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const ok = await onRequest(`/api/admin/brands/${brandId}/deliverables`, "POST", { title: title.trim(), dueAt: dueAt || null, network: network || null });
    setBusy(false);
    if (ok) {
      setTitle("");
      setDueAt("");
    }
  }

  const patch = (id: string, body: Record<string, unknown>) => onRequest(`/api/admin/deliverables/${id}`, "PATCH", body);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-sp-2">
        <p className={eyebrowClass}>{t("Entregables", "Deliverables")}</p>
        {deliverables.length > 0 && (
          <span className="text-xs text-ink/55">
            {done}/{deliverables.length} {t("listos", "done")}
          </span>
        )}
      </div>
      {deliverables.length === 0 ? (
        <p className="mt-sp-2 text-[13px] text-ink/55">
          {t("Anota lo que tienes que entregar (ej.: 2 reels y 3 historias) y te avisamos 2 días antes.", "List what you need to deliver (e.g. 2 reels and 3 stories) and we'll remind you 2 days before.")}
        </p>
      ) : (
        <ul className="mt-sp-2 flex flex-col gap-sp-2">
          {deliverables.map((d, i) => {
            const status = (DELIVERABLE_STATUSES as readonly string[]).includes(d.status) ? (d.status as DeliverableStatus) : "todo";
            const late = d.dueAt && !isDeliverableDone(d.status) && daysUntil(d.dueAt) < 0;
            return (
              <li key={d.id} className="rounded-[12px] border border-line bg-white p-sp-3">
                <div className="flex flex-wrap items-start gap-sp-2">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${isDeliverableDone(d.status) ? "text-ink/50 line-through decoration-ink/30" : "text-ink"}`}>{d.title}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-sp-2 text-xs text-ink/55">
                      {d.network && <span>{NETWORK_LABEL[d.network] ?? d.network}</span>}
                      {d.dueAt && (
                        <span className={late ? "font-semibold text-coral" : ""}>
                          📅 {formatShortDate(d.dueAt, lang)}
                          {!isDeliverableDone(d.status) && ` · ${dueLabel(d.dueAt, lang)}`}
                        </span>
                      )}
                      {d.proofUrl && (
                        <a href={d.proofUrl} target="_blank" rel="noreferrer" className="font-semibold text-coral hover:underline">
                          {t("Ver entrega ↗", "View delivery ↗")}
                        </a>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={i === 0} onClick={() => patch(d.id, { move: "up" })} aria-label={t("Subir", "Move up")} className="px-1 text-ink/40 hover:text-ink disabled:opacity-20">
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={i === deliverables.length - 1}
                      onClick={() => patch(d.id, { move: "down" })}
                      aria-label={t("Bajar", "Move down")}
                      className="px-1 text-ink/40 hover:text-ink disabled:opacity-20"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="mt-sp-2 flex flex-wrap items-center gap-1.5">
                  {DELIVERABLE_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => s !== status && patch(d.id, { status: s })}
                      aria-pressed={s === status}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${s === status ? `${DELIVERABLE_STATUS_META[s].className} ring-1 ring-current` : "text-ink/45 hover:text-ink"}`}
                    >
                      {pickLabel(lang, DELIVERABLE_STATUS_META[s])}
                    </button>
                  ))}
                  <span className="ml-auto flex items-center gap-sp-3 text-[11px]">
                    <label className="flex items-center gap-1 text-ink/50">
                      📅
                      <input
                        type="date"
                        value={dateToInput(d.dueAt)}
                        onChange={(e) => patch(d.id, { dueAt: e.target.value || null })}
                        aria-label={t("Fecha de entrega", "Due date")}
                        className="rounded border border-line bg-white px-1 py-0.5 text-[11px] text-ink"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProof(editingProof === d.id ? null : d.id);
                        setProof(d.proofUrl ?? "");
                      }}
                      className="font-semibold text-ink/50 hover:text-coral"
                    >
                      {t("Enlace", "Link")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t(`¿Borrar «${d.title}»?`, `Delete “${d.title}”?`))) onRequest(`/api/admin/deliverables/${d.id}`, "DELETE");
                      }}
                      className="text-ink/40 hover:text-red-600"
                    >
                      {t("Borrar", "Delete")}
                    </button>
                  </span>
                </div>
                {editingProof === d.id && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (await patch(d.id, { proofUrl: proof.trim() })) setEditingProof(null);
                    }}
                    className="mt-sp-2 flex gap-sp-2"
                  >
                    <input
                      type="url"
                      value={proof}
                      onChange={(e) => setProof(e.target.value)}
                      placeholder={t("https://… (la publicación o el archivo entregado)", "https://… (the post or delivered file)")}
                      className={`${inputClass} min-w-0 flex-1 py-sp-2 text-sm`}
                    />
                    <button type="submit" className={secondaryButtonClass}>
                      {t("Guardar", "Save")}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={add} className="mt-sp-3 flex flex-col gap-sp-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className={`${inputClass} flex-1`}
          placeholder={t("Ej.: Reel de 30 s con el producto", "E.g.: 30 s reel with the product")}
          aria-label={t("Qué vas a entregar", "What you'll deliver")}
        />
        <select value={network} onChange={(e) => setNetwork(e.target.value)} className={`${inputClass} sm:w-36`} aria-label={t("Red", "Network")}>
          <option value="">{t("Red (opcional)", "Network (optional)")}</option>
          {DELIVERABLE_NETWORKS.filter((n) => n !== "otro").map((n) => (
            <option key={n} value={n}>
              {NETWORK_LABEL[n]}
            </option>
          ))}
        </select>
        <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={`${inputClass} sm:w-40`} aria-label={t("Fecha de entrega", "Due date")} />
        <button type="submit" disabled={busy || !title.trim()} className={secondaryButtonClass}>
          {t("Agregar", "Add")}
        </button>
      </form>
    </div>
  );
}
