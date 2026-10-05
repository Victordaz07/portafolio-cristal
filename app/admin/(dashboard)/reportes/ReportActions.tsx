"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

const NETWORKS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
];

export default function ReportActions({
  currentMonth,
  months,
  mediaKit,
  siteUrl,
}: {
  siteUrl: string;
  currentMonth: string;
  months: { value: string; label: string }[];
  mediaKit: { name: string; niche: string; followers: string; engagement: string; collabs: string };
}) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [month, setMonth] = useState(currentMonth);
  const [refreshing, setRefreshing] = useState(false);
  const [manual, setManual] = useState({ platform: "instagram", date: "", followers: "" });
  const [copied, setCopied] = useState(false);

  async function refresh() {
    setRefreshing(true);
    const response = await fetch("/api/admin/reports/followers", { method: "POST" });
    const data: { results: { platform: string; error?: string }[] } = await response.json();
    setRefreshing(false);
    if (data.results.length === 0) return showToast("error", t("No hay redes conectadas: carga los seguidores a mano", "No connected networks: add your followers by hand"));
    const failed = data.results.filter((r) => r.error);
    if (failed.length) showToast("error", failed.map((r) => `${r.platform}: ${r.error}`).join(" · "));
    else showToast("success", t("Seguidores actualizados", "Followers updated"));
    router.refresh();
  }

  async function saveManual(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/reports/followers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...manual, followers: Number(manual.followers.replace(/[.,\s]/g, "")) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", t("Guardado en el historial", "Saved to history"));
    setManual((m) => ({ ...m, followers: "" }));
    router.refresh();
  }

  async function copyMediaKit() {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/media-kit`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("error", t("No se pudo copiar; el link es tu-sitio/media-kit", "Couldn't copy; the link is your-site/media-kit"));
    }
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="rounded-[18px] bg-ink p-sp-5 text-cream">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime">{t("Media kit público", "Public media kit")}</p>
        <p className="mt-sp-2 font-fraunces text-2xl font-semibold">{mediaKit.name}</p>
        <p className="text-xs text-cream/65">{mediaKit.niche}</p>
        <div className="mt-sp-4 grid grid-cols-3 gap-sp-3">
          {[
            { label: t("Seguidores", "Followers"), value: mediaKit.followers },
            { label: "Engagement", value: mediaKit.engagement },
            { label: t("Colaboraciones", "Collaborations"), value: mediaKit.collabs },
          ].map((k) => (
            <div key={k.label}>
              <p className="font-fraunces text-xl font-semibold text-lime">{k.value}</p>
              <p className="text-[11px] text-cream/65">{k.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-sp-4 flex flex-wrap gap-sp-2">
          <button type="button" onClick={copyMediaKit} className="rounded-full bg-lime px-sp-4 py-sp-2 text-xs font-bold text-ink">
            {copied ? t("¡Link copiado!", "Link copied!") : t("Copiar enlace", "Copy link")}
          </button>
          <a href={`${siteUrl}/media-kit`} target="_blank" rel="noreferrer" className="rounded-full border border-cream/30 px-sp-4 py-sp-2 text-xs font-semibold">
            {t("Ver media kit ↗", "View media kit ↗")}
          </a>
        </div>
      </div>

      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Reporte mensual (PDF)", "Monthly report (PDF)")}</p>
        <p className="mt-sp-1 text-[13px] text-ink/60">
          {t("Ábrelo y usa “Guardar como PDF” al imprimir. Sirve para mandarlo a las marcas o para ti.", "Open it and use “Save as PDF” when printing. Send it to brands or keep it for yourself.")}
        </p>
        <div className="mt-sp-3 flex flex-wrap gap-sp-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-auto`} aria-label={t("Mes", "Month")}>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <Link href={`/admin/reportes/mensual?month=${month}`} className={primaryButtonClass}>
            {t("Ver reporte", "View report")}
          </Link>
        </div>
      </Card>

      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Historial de seguidores", "Follower history")}</p>
        <div className="mt-sp-2 flex flex-wrap items-center gap-sp-3">
          <button type="button" onClick={refresh} disabled={refreshing} className={secondaryButtonClass}>
            {refreshing ? t("Actualizando…", "Updating…") : t("↻ Actualizar desde redes conectadas", "↻ Update from connected networks")}
          </button>
        </div>
        <form onSubmit={saveManual} className="mt-sp-3 grid gap-sp-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            value={manual.platform}
            onChange={(e) => setManual((m) => ({ ...m, platform: e.target.value }))}
            className={inputClass}
            aria-label={t("Red", "Network")}
          >
            {NETWORKS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={manual.date}
            onChange={(e) => setManual((m) => ({ ...m, date: e.target.value }))}
            className={inputClass}
            aria-label={t("Fecha", "Date")}
          />
          <input
            required
            inputMode="numeric"
            value={manual.followers}
            onChange={(e) => setManual((m) => ({ ...m, followers: e.target.value }))}
            className={inputClass}
            placeholder={t("Seguidores", "Followers")}
            aria-label={t("Seguidores", "Followers")}
          />
          <button type="submit" className={secondaryButtonClass}>
            {t("Guardar", "Save")}
          </button>
        </form>
        <p className="mt-sp-2 text-[11px] text-ink/50">
          {t(
            "Para las redes sin conectar, o para cargar meses anteriores (sirve tomarlo de las estadísticas de la app).",
            "For networks that aren't connected, or to add previous months (you can take it from the app's stats)."
          )}
        </p>
      </Card>
    </div>
  );
}
