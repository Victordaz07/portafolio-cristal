"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

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
}: {
  currentMonth: string;
  months: { value: string; label: string }[];
  mediaKit: { name: string; niche: string; followers: string; engagement: string; collabs: string };
}) {
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
    if (data.results.length === 0) return showToast("error", "No hay redes conectadas: carga los seguidores a mano");
    const failed = data.results.filter((r) => r.error);
    if (failed.length) showToast("error", failed.map((r) => `${r.platform}: ${r.error}`).join(" · "));
    else showToast("success", "Seguidores actualizados");
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
    if (!response.ok) return showToast("error", data.error ?? "No se pudo guardar");
    showToast("success", "Guardado en el historial");
    setManual((m) => ({ ...m, followers: "" }));
    router.refresh();
  }

  async function copyMediaKit() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/media-kit`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("error", "No se pudo copiar; el link es tu-sitio/media-kit");
    }
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="rounded-[18px] bg-ink p-sp-5 text-cream">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime">Media kit público</p>
        <p className="mt-sp-2 font-fraunces text-2xl font-semibold">{mediaKit.name}</p>
        <p className="text-xs text-cream/65">{mediaKit.niche}</p>
        <div className="mt-sp-4 grid grid-cols-3 gap-sp-3">
          {[
            { label: "Seguidores", value: mediaKit.followers },
            { label: "Engagement", value: mediaKit.engagement },
            { label: "Colaboraciones", value: mediaKit.collabs },
          ].map((k) => (
            <div key={k.label}>
              <p className="font-fraunces text-xl font-semibold text-lime">{k.value}</p>
              <p className="text-[11px] text-cream/65">{k.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-sp-4 flex flex-wrap gap-sp-2">
          <button type="button" onClick={copyMediaKit} className="rounded-full bg-lime px-sp-4 py-sp-2 text-xs font-bold text-ink">
            {copied ? "¡Link copiado!" : "Copiar enlace"}
          </button>
          <a href="/media-kit" target="_blank" rel="noreferrer" className="rounded-full border border-cream/30 px-sp-4 py-sp-2 text-xs font-semibold">
            Ver media kit ↗
          </a>
        </div>
      </div>

      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Reporte mensual (PDF)</p>
        <p className="mt-sp-1 text-[13px] text-ink/60">Ábrelo y usa “Guardar como PDF” al imprimir. Sirve para mandarlo a las marcas o para ti.</p>
        <div className="mt-sp-3 flex flex-wrap gap-sp-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-auto`} aria-label="Mes">
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <Link href={`/admin/reportes/mensual?month=${month}`} className={primaryButtonClass}>
            Ver reporte
          </Link>
        </div>
      </Card>

      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Historial de seguidores</p>
        <div className="mt-sp-2 flex flex-wrap items-center gap-sp-3">
          <button type="button" onClick={refresh} disabled={refreshing} className={secondaryButtonClass}>
            {refreshing ? "Actualizando…" : "↻ Actualizar desde redes conectadas"}
          </button>
        </div>
        <form onSubmit={saveManual} className="mt-sp-3 grid gap-sp-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            value={manual.platform}
            onChange={(e) => setManual((m) => ({ ...m, platform: e.target.value }))}
            className={inputClass}
            aria-label="Red"
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
            aria-label="Fecha"
          />
          <input
            required
            inputMode="numeric"
            value={manual.followers}
            onChange={(e) => setManual((m) => ({ ...m, followers: e.target.value }))}
            className={inputClass}
            placeholder="Seguidores"
            aria-label="Seguidores"
          />
          <button type="submit" className={secondaryButtonClass}>
            Guardar
          </button>
        </form>
        <p className="mt-sp-2 text-[11px] text-ink/50">
          Para las redes sin conectar, o para cargar meses anteriores (sirve tomarlo de las estadísticas de la app).
        </p>
      </Card>
    </div>
  );
}
