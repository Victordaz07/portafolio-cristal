"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { publicReport, REPORT_METRICS, type ReportData, type ReportMetric } from "@/lib/campaign-report";
import { formatCompact } from "@/lib/metrics";
import ReportDocument from "@/components/campaign/ReportDocument";

interface EditorReport {
  id: string;
  title: string;
  intro: string;
  language: "es" | "en";
  hidden: string[];
  inMediaKit: boolean;
  status: "draft" | "sent";
  sentAt: string | null;
  viewedAt: string | null;
  data: ReportData;
}

/** Editor del reporte de campaña: qué publicaciones y qué métricas ve la marca, con vista previa en vivo, y envío por correo. */
export default function ReportEditor({ report, brand, creatorName, link, readOnly }: { report: EditorReport; brand: { name: string; contactEmail: string }; creatorName: string; link: string; readOnly: boolean }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [title, setTitle] = useState(report.title);
  const [intro, setIntro] = useState(report.intro);
  const [language, setLanguage] = useState<"es" | "en">(report.language);
  const [hidden, setHidden] = useState<string[]>(report.hidden);
  const [inMediaKit, setInMediaKit] = useState(report.inMediaKit);
  const [data, setData] = useState<ReportData>(report.data);
  const [status, setStatus] = useState(report.status);
  const [email, setEmail] = useState(brand.contactEmail);
  const [busy, setBusy] = useState<null | "save" | "refresh" | "send" | "delete">(null);

  const labels: Record<ReportMetric, string> = {
    views: t("Vistas", "Views"),
    likes: t("Me gusta", "Likes"),
    comments: t("Comentarios", "Comments"),
    shares: t("Compartidos", "Shares"),
    saves: t("Guardados", "Saves"),
    engagement: t("Interacción (%)", "Engagement (%)"),
    comparison: t("Comparación con tu promedio", "Comparison with your average"),
    topComments: t("Comentarios destacados", "Top comments"),
  };

  // Lo que ve la marca, calculado con la misma función que usa la página pública.
  const preview = useMemo(() => publicReport(data, hidden), [data, hidden]);
  const includeMap = () => Object.fromEntries(data.posts.map((p) => [p.key, p.include]));

  async function patch(body: object, kind: "save" | "refresh") {
    setBusy(kind);
    const response = await fetch(`/api/admin/campaign-reports/${report.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      showToast("error", result.error ?? t("No se pudo guardar", "Couldn't save"));
      return null;
    }
    return result as { data: ReportData };
  }

  const saveBody = () => ({ title, intro, language, hidden, inMediaKit, include: includeMap() });

  async function save() {
    if (await patch(saveBody(), "save")) {
      showToast("success", t("Cambios guardados", "Changes saved"));
      router.refresh();
    }
  }

  async function refresh() {
    const result = await patch({ ...saveBody(), refresh: true }, "refresh");
    if (result) {
      setData(result.data);
      showToast("success", t("Números actualizados", "Numbers updated"));
    }
  }

  async function send() {
    if (!email.trim()) return showToast("error", t("Escribe el correo de la marca", "Enter the brand's email"));
    if (!(await patch(saveBody(), "save"))) return;
    setBusy("send");
    const response = await fetch(`/api/admin/campaign-reports/${report.id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const result = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) return showToast("error", result.error ?? t("No se pudo enviar", "Couldn't send"));
    setStatus("sent");
    showToast("success", result.emailed ? t("Reporte enviado a la marca", "Report sent to the brand") : t("Guardado como enviado, pero el correo no salió: copia el enlace y mándalo tú", "Saved as sent, but the email didn't go out: copy the link and send it yourself"));
    router.refresh();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      showToast("success", t("Enlace copiado", "Link copied"));
    } catch {
      showToast("error", t("No se pudo copiar; el enlace está abajo", "Couldn't copy; the link is below"));
    }
  }

  async function remove() {
    if (!window.confirm(t("¿Borrar este reporte? El enlace deja de funcionar.", "Delete this report? The link stops working."))) return;
    setBusy("delete");
    const response = await fetch(`/api/admin/campaign-reports/${report.id}`, { method: "DELETE" });
    setBusy(null);
    if (!response.ok) return showToast("error", t("No se pudo borrar", "Couldn't delete"));
    router.push("/admin/campanas");
    router.refresh();
  }

  const toggleHidden = (metric: string) => setHidden((h) => (h.includes(metric) ? h.filter((x) => x !== metric) : [...h, metric]));
  const togglePost = (key: string) => setData((d) => ({ ...d, posts: d.posts.map((p) => (p.key === key ? { ...p, include: !p.include } : p)) }));

  return (
    <div className="grid gap-sp-5 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="flex flex-col gap-sp-4">
        <Card>
          <div className="flex flex-wrap items-center gap-sp-2">
            <span className={`rounded-full px-sp-3 py-1 font-mono text-[11px] uppercase ${status === "sent" ? "bg-cobalt/15 text-cobalt-ink" : "bg-coral/15 text-coral"}`}>{status === "sent" ? t("Enviado", "Sent") : t("Borrador", "Draft")}</span>
            {report.viewedAt && <span className="rounded-full bg-lime/40 px-sp-3 py-1 font-mono text-[11px] uppercase text-moss">{t("La marca lo abrió", "The brand opened it")}</span>}
          </div>
          {status === "sent" && <p className="mt-sp-2 text-xs text-ink/60">{t("Los cambios que guardes se ven de inmediato en el enlace que ya enviaste.", "Changes you save show up right away on the link you already sent.")}</p>}
          <div className="mt-sp-4 flex flex-col gap-sp-3">
            <label className={labelClass}>
              <span className="text-xs font-medium text-ink">{t("Título", "Title")}</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} disabled={readOnly} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className="text-xs font-medium text-ink">{t("Idioma del reporte y del correo", "Report and email language")}</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value as "es" | "en")} disabled={readOnly} className={inputClass}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className={labelClass}>
              <span className="text-xs font-medium text-ink">{t("Mensaje para la marca (opcional)", "Message for the brand (optional)")}</span>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={4} maxLength={1500} disabled={readOnly} placeholder={t("Gracias por confiar en mí. Aquí tienes cómo nos fue…", "Thank you for trusting me. Here's how it went…")} className={inputClass} />
            </label>
          </div>
        </Card>

        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Qué métricas ve la marca", "Which metrics the brand sees")}</p>
          <p className="mb-sp-3 text-xs text-ink/60">{t("Desmarca lo que no quieras mostrar: no aparece en ningún lado de la página.", "Untick anything you don't want to show: it doesn't appear anywhere on the page.")}</p>
          <ul className="grid gap-sp-2 sm:grid-cols-2">
            {REPORT_METRICS.map((m) => (
              <li key={m}>
                <label className="flex items-center gap-sp-2 text-sm text-ink">
                  <input type="checkbox" checked={!hidden.includes(m)} onChange={() => toggleHidden(m)} disabled={readOnly} />
                  {labels[m]}
                </label>
              </li>
            ))}
          </ul>
          <label className="mt-sp-3 flex items-start gap-sp-2 border-t border-line pt-sp-3 text-sm text-ink">
            <input type="checkbox" className="mt-1" checked={inMediaKit} onChange={(e) => setInMediaKit(e.target.checked)} disabled={readOnly} />
            <span>
              {t("Mostrar como caso de éxito en mi media kit", "Show as a success story in my media kit")}
              <span className="block text-xs text-ink/60">{t("Solo aparece cuando el reporte ya se envió, y con las mismas métricas que dejaste visibles arriba.", "It only appears once the report has been sent, with the same metrics you left visible above.")}</span>
            </span>
          </label>
        </Card>

        <Card>
          <div className="mb-sp-2 flex items-center justify-between gap-sp-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Publicaciones del reporte", "Posts in the report")}</p>
            <button type="button" onClick={refresh} disabled={busy !== null || readOnly} className="text-xs font-semibold text-coral hover:underline disabled:opacity-50">
              {busy === "refresh" ? t("Actualizando…", "Updating…") : t("↻ Actualizar números", "↻ Update numbers")}
            </button>
          </div>
          {data.posts.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Todavía no hay publicaciones de esta marca. Vincula publicaciones del Feed a la marca o marca entregables como publicados con su enlace, y toca «Actualizar números».", "There are no posts for this brand yet. Link Feed posts to the brand or mark deliverables as published with their link, then tap “Update numbers”.")}</p>
          ) : (
            <ul className="flex flex-col gap-sp-2">
              {data.posts.map((p) => (
                <li key={p.key}>
                  <label className="flex items-start gap-sp-2 rounded-[12px] border border-line p-sp-2 text-sm text-ink">
                    <input type="checkbox" className="mt-1" checked={p.include} onChange={() => togglePost(p.key)} disabled={readOnly} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{p.title}</span>
                      <span className="block text-xs text-ink/55">
                        {p.views != null ? `${formatCompact(p.views)} ${t("vistas", "views")}` : t("sin números", "no numbers")}
                        {p.platform ? ` · ${p.platform}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {!readOnly && (
          <Card>
            <div className="flex flex-wrap items-center gap-sp-2">
              <button type="button" onClick={save} disabled={busy !== null} className={primaryButtonClass}>
                {busy === "save" ? t("Guardando…", "Saving…") : t("Guardar cambios", "Save changes")}
              </button>
              <a href={link} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
                {t("Ver como la verá la marca ↗", "See what the brand sees ↗")}
              </a>
            </div>
            <p className="mt-sp-2 text-[11px] text-ink/50">{t("Guarda antes de abrir la vista previa.", "Save before opening the preview.")}</p>
            <div className="mt-sp-4 border-t border-line pt-sp-4">
              <label className={labelClass}>
                <span className="text-xs font-medium text-ink">{t("Correo de la marca", "Brand's email")}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marca@correo.com" className={inputClass} />
              </label>
              <div className="mt-sp-3 flex flex-wrap gap-sp-2">
                <button type="button" onClick={send} disabled={busy !== null} className={primaryButtonClass}>
                  {busy === "send" ? t("Enviando…", "Sending…") : status === "sent" ? t("Reenviar a la marca", "Resend to the brand") : t("Enviar a la marca", "Send to the brand")}
                </button>
                <button type="button" onClick={copyLink} className={secondaryButtonClass}>
                  {t("Copiar enlace", "Copy link")}
                </button>
              </div>
              <p className="mt-sp-2 break-all font-mono text-[11px] text-ink/45">{link}</p>
            </div>
            <button type="button" onClick={remove} disabled={busy !== null} className="mt-sp-4 text-xs font-semibold text-ink/50 hover:text-coral">
              {t("Borrar este reporte", "Delete this report")}
            </button>
          </Card>
        )}
      </div>

      <div className="min-w-0">
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/50">{t("Vista previa en vivo", "Live preview")}</p>
        <div className="rounded-[18px] bg-cream p-sp-3 sm:p-sp-4">
          <ReportDocument lang={language} title={title} intro={intro.trim() || null} brandName={brand.name} creatorName={creatorName} report={preview} repeatUrl="#" />
        </div>
        <p className="mt-sp-2 text-xs text-ink/50">{lang === "en" ? "The “Shall we do it again?” button links to your packages." : "El botón «¿Repetimos?» lleva a tus paquetes."}</p>
      </div>
    </div>
  );
}
