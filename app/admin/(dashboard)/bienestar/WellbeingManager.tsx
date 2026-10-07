"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { CONTENT_TYPES, NETWORK_META, PLAN_NETWORKS, contentTypeLabel, type PlanNetwork } from "@/lib/content-plan";
import { MAX_LOAD_LIMIT, restNoticeDraft } from "@/lib/wellbeing";
import { addDays } from "@/lib/growth";

interface Period {
  id: string;
  startDate: string;
  endDate: string;
  note: string;
  undone: boolean;
  moved: number;
  brands: { brandId: string; brandName: string; email: string | null; titles: string[]; sentAt: string | null }[];
}
interface BankItem {
  id: string;
  title: string;
  caption: string;
  contentType: string;
  networks: string[];
  used: boolean;
}
interface Preview {
  days: number;
  posts: number;
  deliverables: number;
  affected: number;
  notices: { brandId: string; brandName: string; hasEmail: boolean; titles: string[] }[];
}

const label = "flex flex-col gap-sp-1 text-xs font-medium text-ink";
const eyebrow = "mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

export default function WellbeingManager({ today, creatorName, loadLimit, periods, bank }: { today: string; creatorName: string; loadLimit: number; periods: Period[]; bank: BankItem[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: object) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
    setBusy(false);
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return null;
    }
    return data;
  }

  // ─── Límite de carga ───
  const [limit, setLimit] = useState(String(loadLimit));
  async function saveLimit() {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > MAX_LOAD_LIMIT) return showToast("error", t(`Elige un número entre 1 y ${MAX_LOAD_LIMIT}`, `Choose a number between 1 and ${MAX_LOAD_LIMIT}`));
    if (await call("/api/admin/wellbeing/settings", "PATCH", { loadLimit: n })) {
      showToast("success", t("Límite guardado", "Limit saved"));
      router.refresh();
    }
  }

  // ─── Descanso ───
  const [start, setStart] = useState(addDays(today, 1));
  const [end, setEnd] = useState(addDays(today, 7));
  const [note, setNote] = useState("");
  const [moveDeliverables, setMoveDeliverables] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const body = { start, end, note, moveDeliverables };

  async function doPreview() {
    const data = await call("/api/admin/wellbeing/rest", "POST", { ...body, preview: true });
    if (data) setPreview(data as unknown as Preview);
  }
  async function activate() {
    if (!window.confirm(t("¿Activar el descanso? Moveremos tus publicaciones programadas de esas fechas. Puedes deshacerlo.", "Turn on the break? We'll move your scheduled posts from those dates. You can undo it."))) return;
    if (await call("/api/admin/wellbeing/rest", "POST", body)) {
      showToast("success", t("Descanso activado. ¡A recargar energía!", "Break on. Time to recharge!"));
      setPreview(null);
      router.refresh();
    }
  }
  async function undo(id: string) {
    if (!window.confirm(t("¿Deshacer este descanso? Lo movido vuelve a su fecha (salvo lo que ya cambiaste).", "Undo this break? Moved items go back to their date (except what you've already changed)."))) return;
    const data = await call(`/api/admin/wellbeing/rest/${id}/undo`, "POST");
    if (data) {
      showToast("success", t("Descanso deshecho", "Break undone"));
      router.refresh();
    }
  }

  // ─── Avisos a marcas ───
  const [noticeFor, setNoticeFor] = useState<{ period: Period; brand: Period["brands"][number] } | null>(null);
  const [noticeText, setNoticeText] = useState("");
  function openNotice(period: Period, brand: Period["brands"][number]) {
    setNoticeFor({ period, brand });
    setNoticeText(restNoticeDraft({ creatorName, brandName: brand.brandName, titles: brand.titles, start: period.startDate, end: period.endDate, newDate: addDays(period.endDate, 1), lang }));
  }
  async function sendNotice() {
    if (!noticeFor) return;
    if (await call(`/api/admin/wellbeing/rest/${noticeFor.period.id}/notice`, "POST", { brandId: noticeFor.brand.brandId, message: noticeText })) {
      showToast("success", t("Aviso enviado", "Notice sent"));
      setNoticeFor(null);
      router.refresh();
    }
  }

  // ─── Banco de contenido ───
  const [item, setItem] = useState({ title: "", caption: "", contentType: "reel", networks: ["instagram"] as PlanNetwork[] });
  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (await call("/api/admin/wellbeing/bank", "POST", item)) {
      showToast("success", t("Idea guardada en el banco", "Idea saved to the bank"));
      setItem({ ...item, title: "", caption: "" });
      router.refresh();
    }
  }
  const [scheduling, setScheduling] = useState<BankItem | null>(null);
  const [slot, setSlot] = useState({ date: addDays(today, 1), time: "18:00", networks: ["instagram"] as PlanNetwork[] });
  async function schedule() {
    if (!scheduling) return;
    if (await call(`/api/admin/wellbeing/bank/${scheduling.id}/schedule`, "POST", slot)) {
      showToast("success", t("Programada en tu calendario", "Scheduled in your calendar"));
      setScheduling(null);
      router.refresh();
    }
  }
  const toggleNetwork = (list: PlanNetwork[], n: PlanNetwork) => (list.includes(n) ? list.filter((x) => x !== n) : [...list, n]);

  return (
    <>
      <Card>
        <p className={eyebrow}>{t("Tu límite", "Your limit")}</p>
        <label className={label}>
          {t("Máximo de entregas en 7 días antes de avisarte", "Maximum deliverables in 7 days before warning you")}
          <span className="flex items-center gap-sp-2">
            <input type="number" min={1} max={MAX_LOAD_LIMIT} value={limit} onChange={(e) => setLimit(e.target.value)} className={`${inputClass} w-24`} />
            <button type="button" onClick={saveLimit} disabled={busy} className={secondaryButtonClass}>{t("Guardar", "Save")}</button>
          </span>
        </label>
      </Card>

      <Card>
        <p className={eyebrow}>{t("Modo descanso", "Rest mode")}</p>
        <p className="mb-sp-3 text-sm text-ink/70">
          {t(
            "Elige las fechas de tu descanso: movemos tus publicaciones programadas de ese periodo hacia adelante (tantos días como dura el descanso) y, si quieres, también las fechas de entrega. Después puedes avisarles a las marcas con entregas en ese periodo. Todo se puede deshacer.",
            "Choose your break dates: we move your scheduled posts from that period forward (as many days as the break lasts) and, if you want, the delivery dates too. Afterwards you can let the brands with deliveries in that period know. Everything can be undone."
          )}
        </p>
        <div className="grid gap-sp-3 sm:grid-cols-2">
          <label className={label}>{t("Desde", "From")}<input type="date" value={start} min={today} onChange={(e) => { setStart(e.target.value); setPreview(null); }} className={inputClass} /></label>
          <label className={label}>{t("Hasta (inclusive)", "Until (inclusive)")}<input type="date" value={end} min={start} onChange={(e) => { setEnd(e.target.value); setPreview(null); }} className={inputClass} /></label>
          <label className={`${label} sm:col-span-2`}>{t("Nota para ti (opcional)", "Note for yourself (optional)")}<input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} /></label>
          <label className="flex items-center gap-sp-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" checked={moveDeliverables} onChange={(e) => { setMoveDeliverables(e.target.checked); setPreview(null); }} />
            {t("También mover las fechas de entrega de ese periodo", "Also move the delivery dates in that period")}
          </label>
        </div>
        <div className="mt-sp-3 flex flex-wrap gap-sp-2">
          <button type="button" onClick={doPreview} disabled={busy} className={secondaryButtonClass}>{t("Ver qué se movería", "See what would move")}</button>
          {preview && <button type="button" onClick={activate} disabled={busy} className={primaryButtonClass}>{t("Activar descanso", "Turn on break")}</button>}
        </div>
        {preview && (
          <div className="mt-sp-3 rounded-[12px] bg-cream p-sp-3 text-sm text-ink">
            <p>
              {t(
                `Descanso de ${preview.days} día(s): se moverían ${preview.posts} publicación(es)${moveDeliverables ? ` y ${preview.deliverables} entrega(s)` : ""}.`,
                `${preview.days}-day break: ${preview.posts} post(s)${moveDeliverables ? ` and ${preview.deliverables} deliverable(s)` : ""} would move.`
              )}
            </p>
            {preview.affected > 0 && (
              <p className="mt-1 text-xs text-ink/70">
                {t(`Hay ${preview.affected} entrega(s) en ese periodo (${preview.notices.map((n) => n.brandName).join(", ")}). Al activar podrás avisarles.`, `${preview.affected} deliverable(s) fall in that period (${preview.notices.map((n) => n.brandName).join(", ")}). Once you turn it on you can let them know.`)}
              </p>
            )}
          </div>
        )}

        {periods.length > 0 && (
          <ul className="mt-sp-4 flex flex-col divide-y divide-line border-t border-line">
            {periods.map((p) => (
              <li key={p.id} className="flex flex-col gap-sp-2 py-sp-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-sp-2">
                  <p className="text-ink">
                    {p.startDate} → {p.endDate} {p.note && <span className="text-ink/60">· {p.note}</span>}
                    <span className="ml-sp-2 text-xs text-ink/50">{p.undone ? t("deshecho", "undone") : t(`${p.moved} movido(s)`, `${p.moved} moved`)}</span>
                  </p>
                  {!p.undone && p.moved > 0 && <button type="button" onClick={() => undo(p.id)} disabled={busy} className="text-xs font-semibold text-coral hover:underline">{t("Deshacer", "Undo")}</button>}
                </div>
                {!p.undone && p.brands.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {p.brands.map((b) => (
                      <li key={b.brandId} className="flex flex-wrap items-center justify-between gap-sp-2 text-xs text-ink/70">
                        <span>{b.brandName} · {b.titles.join(", ")}</span>
                        {b.sentAt ? (
                          <span className="text-moss">{t("Aviso enviado", "Notice sent")}</span>
                        ) : b.email ? (
                          <button type="button" onClick={() => openNotice(p, b)} className="font-semibold text-coral hover:underline">{t("Avisar a la marca", "Notify the brand")}</button>
                        ) : (
                          <span className="text-ink/40">{t("Sin correo de contacto", "No contact email")}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {noticeFor && (
        <Card className="border-coral/40">
          <p className={eyebrow}>{t(`Aviso para ${noticeFor.brand.brandName}`, `Notice for ${noticeFor.brand.brandName}`)}</p>
          <p className="mb-sp-2 text-xs text-ink/60">{t(`Se enviará a ${noticeFor.brand.email}. Revisa y edita el texto antes de enviarlo.`, `It will be sent to ${noticeFor.brand.email}. Review and edit the text before sending.`)}</p>
          <textarea value={noticeText} onChange={(e) => setNoticeText(e.target.value)} rows={9} maxLength={2000} className={inputClass} />
          <div className="mt-sp-3 flex gap-sp-2">
            <button type="button" onClick={sendNotice} disabled={busy || noticeText.trim().length < 10} className={primaryButtonClass}>{t("Enviar aviso", "Send notice")}</button>
            <button type="button" onClick={() => setNoticeFor(null)} className={secondaryButtonClass}>{t("Cancelar", "Cancel")}</button>
          </div>
        </Card>
      )}

      <Card>
        <p className={eyebrow}>{t("Banco de contenido", "Content bank")}</p>
        <p className="mb-sp-3 text-sm text-ink/70">{t("Guarda ideas y piezas listas para las semanas flojas. Cuando las necesites, prográmalas en el calendario con un clic.", "Keep ideas and ready-made pieces for slow weeks. When you need them, schedule them in your calendar with one click.")}</p>
        <form onSubmit={addItem} className="grid gap-sp-3 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>{t("Idea o título", "Idea or title")}<input required maxLength={120} value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} className={inputClass} /></label>
          <label className={label}>{t("Tipo", "Type")}
            <select value={item.contentType} onChange={(e) => setItem({ ...item, contentType: e.target.value })} className={inputClass}>
              {CONTENT_TYPES.map((c) => <option key={c} value={c}>{contentTypeLabel(c, lang)}</option>)}
            </select>
          </label>
          <fieldset className={label}>
            <legend className="mb-1">{t("Redes", "Networks")}</legend>
            <span className="flex flex-wrap gap-sp-2">
              {PLAN_NETWORKS.map((n) => (
                <label key={n} className="flex items-center gap-1 text-xs font-normal"><input type="checkbox" checked={item.networks.includes(n)} onChange={() => setItem({ ...item, networks: toggleNetwork(item.networks, n) })} />{NETWORK_META[n].label}</label>
              ))}
            </span>
          </fieldset>
          <label className={`${label} sm:col-span-2`}>{t("Texto o notas (opcional)", "Caption or notes (optional)")}<textarea rows={3} maxLength={5000} value={item.caption} onChange={(e) => setItem({ ...item, caption: e.target.value })} className={inputClass} /></label>
          <button type="submit" disabled={busy || !item.title.trim()} className={`${primaryButtonClass} sm:col-span-2`}>{t("Guardar en el banco", "Save to the bank")}</button>
        </form>

        {bank.length === 0 ? (
          <p className="mt-sp-4 text-sm text-ink/60">{t("Tu banco está vacío. Empieza con 3 ideas para tu próxima semana floja.", "Your bank is empty. Start with 3 ideas for your next slow week.")}</p>
        ) : (
          <ul className="mt-sp-4 flex flex-col divide-y divide-line border-t border-line">
            {bank.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-sp-2 py-sp-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{b.title}</span>
                  <span className="text-xs text-ink/60">{contentTypeLabel(b.contentType, lang)} · {b.networks.map((n) => NETWORK_META[n as PlanNetwork]?.label ?? n).join(", ") || t("sin red", "no network")}{b.used ? ` · ${t("ya programada", "already scheduled")}` : ""}</span>
                </span>
                <span className="flex gap-sp-3 text-xs">
                  <button type="button" onClick={() => { setScheduling(b); setSlot({ ...slot, networks: (b.networks.length ? b.networks : ["instagram"]) as PlanNetwork[] }); }} className="font-semibold text-coral hover:underline">{t("Programar", "Schedule")}</button>
                  <button type="button" disabled={busy} onClick={async () => { if (window.confirm(t("¿Borrar esta idea?", "Delete this idea?")) && (await call(`/api/admin/wellbeing/bank/${b.id}`, "DELETE"))) router.refresh(); }} className="text-red-600/70 hover:text-red-600">{t("Borrar", "Delete")}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {scheduling && (
          <div className="mt-sp-3 rounded-[12px] border border-coral/40 p-sp-3">
            <p className="mb-sp-2 text-sm font-semibold text-ink">{t(`Programar «${scheduling.title}»`, `Schedule “${scheduling.title}”`)}</p>
            <div className="grid gap-sp-3 sm:grid-cols-2">
              <label className={label}>{t("Día", "Day")}<input type="date" value={slot.date} min={today} onChange={(e) => setSlot({ ...slot, date: e.target.value })} className={inputClass} /></label>
              <label className={label}>{t("Hora", "Time")}<input type="time" value={slot.time} onChange={(e) => setSlot({ ...slot, time: e.target.value })} className={inputClass} /></label>
              <span className="flex flex-wrap gap-sp-2 sm:col-span-2">
                {PLAN_NETWORKS.map((n) => (
                  <label key={n} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={slot.networks.includes(n)} onChange={() => setSlot({ ...slot, networks: toggleNetwork(slot.networks, n) })} />{NETWORK_META[n].label}</label>
                ))}
              </span>
            </div>
            <div className="mt-sp-3 flex gap-sp-2">
              <button type="button" onClick={schedule} disabled={busy || slot.networks.length === 0} className={primaryButtonClass}>{t("Programar", "Schedule")}</button>
              <button type="button" onClick={() => setScheduling(null)} className={secondaryButtonClass}>{t("Cancelar", "Cancel")}</button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
