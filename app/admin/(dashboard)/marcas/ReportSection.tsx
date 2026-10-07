"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/admin/AdminLang";
import { useToast } from "@/components/admin/ToastContext";
import { secondaryButtonClass } from "@/lib/admin-ui";

const eyebrowClass = "font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55";

interface ReportLite {
  id: string;
  title: string;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
}

/** Reportes de campaña de una marca (C3): lista y botón para crear uno (los de un trato completado se arman solos). */
export default function ReportSection({ brandId, reports, completed }: { brandId: string; reports: ReportLite[]; completed: boolean }) {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const response = await fetch("/api/admin/campaign-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandId }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo crear el reporte", "Couldn't create the report"));
    router.push(`/admin/campanas/${data.id}`);
  }

  const badge = (r: ReportLite) => (r.viewedAt ? t("La marca lo abrió", "Brand opened it") : r.status === "sent" ? t("Enviado", "Sent") : t("Borrador", "Draft"));

  return (
    <div>
      <p className={eyebrowClass}>{t("Reporte de campaña", "Campaign report")}</p>
      {completed && reports.length === 0 && <p className="mt-sp-2 text-[13px] text-ink/70">{t("Este trato está completado: arma el reporte con los resultados y envíaselo a la marca.", "This deal is completed: build the report with the results and send it to the brand.")}</p>}
      {reports.length > 0 && (
        <ul className="mt-sp-2 flex flex-col gap-sp-2">
          {reports.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/campanas/${r.id}`} className="flex items-center gap-sp-3 text-[13px] hover:opacity-80">
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{r.title}</span>
                <span className="rounded-full bg-cream px-sp-2 py-0.5 font-mono text-[10px] uppercase text-ink/70">{badge(r)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-sp-2">
        <button type="button" onClick={create} disabled={busy} className={secondaryButtonClass}>
          {busy ? t("Armando…", "Building…") : reports.length ? t("+ Otro reporte", "+ Another report") : t("📊 Crear reporte de campaña", "📊 Create campaign report")}
        </button>
      </div>
    </div>
  );
}
