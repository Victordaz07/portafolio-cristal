"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/admin/Card";
import type { LeaderboardRow } from "@/lib/platform-analytics";

type SortKey = "followers" | "growth" | "medianEr" | "measuredPosts" | "revenue";

const COLUMNS: { key: SortKey; label: string; hint: string }[] = [
  { key: "followers", label: "Seguidores", hint: "Suma de todas sus redes" },
  { key: "growth", label: "Crec. 30 días", hint: "Cambio de seguidores en las redes con historial" },
  { key: "medianEr", label: "Engagement", hint: "Engagement mediano de sus publicaciones con +100 vistas" },
  { key: "measuredPosts", label: "Piezas", hint: "Publicaciones con métricas / total en su Feed" },
  { key: "revenue", label: "Cobrado (CRM)", hint: "Tratos marcados como pagados en su CRM" },
];

const money = (n: number) => (n ? `US$${n.toLocaleString("es-US")}` : "—");
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" }) : "—");

/** Ranking de creadores, ordenable por cualquier métrica. */
export default function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  const [sort, setSort] = useState<SortKey>("medianEr");
  const sorted = useMemo(() => [...rows].sort((a, b) => (b[sort] ?? -Infinity) - (a[sort] ?? -Infinity)), [rows, sort]);

  return (
    <Card>
      <div className="mb-sp-3 flex flex-wrap items-center gap-sp-2 text-xs">
        <span className="text-ink/55">Ordenar por:</span>
        {COLUMNS.map((c) => (
          <button
            key={c.key}
            type="button"
            title={c.hint}
            onClick={() => setSort(c.key)}
            aria-pressed={sort === c.key}
            className={`rounded-full px-sp-3 py-1 font-semibold ${sort === c.key ? "bg-ink text-cream" : "border border-line text-ink/70 hover:border-coral"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
            <tr>
              <th className="py-sp-2 pr-sp-3">#</th>
              <th className="py-sp-2 pr-sp-3">Creador/a</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="py-sp-2 pr-sp-3" title={c.hint}>
                  {c.label}
                </th>
              ))}
              <th className="py-sp-2 pr-sp-3">Mejor pieza</th>
              <th className="py-sp-2">Último ingreso</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="py-sp-2 pr-sp-3 font-mono text-ink/45">{i + 1}</td>
                <td className="py-sp-2 pr-sp-3">
                  <Link href={`/admin/plataforma/${r.id}`} className="font-semibold text-ink hover:text-coral">
                    {r.name}
                  </Link>
                  <span className="block text-xs text-ink/55">
                    {r.niche}
                    {r.networks.length ? ` · ${r.networks.join(", ")}` : ""}
                    {r.status !== "active" ? " · pausada" : ""}
                  </span>
                </td>
                <td className="py-sp-2 pr-sp-3 font-mono">{r.followers ? r.followers.toLocaleString("es") : "—"}</td>
                <td className={`py-sp-2 pr-sp-3 font-mono ${r.growth == null ? "text-ink/40" : r.growth >= 0 ? "text-cobalt-ink" : "text-red-600"}`}>
                  {r.growth == null ? "—" : `${r.growth >= 0 ? "▲" : "▼"} ${Math.abs(r.growth)}%`}
                </td>
                <td className="py-sp-2 pr-sp-3 font-mono font-semibold text-ink">{r.medianEr == null ? "—" : `${r.medianEr}%`}</td>
                <td className="py-sp-2 pr-sp-3 font-mono text-ink/70">
                  {r.measuredPosts}/{r.totalPosts}
                </td>
                <td className="py-sp-2 pr-sp-3 font-mono">
                  {money(r.revenue)}
                  {r.pipeline ? <span className="block text-[11px] text-ink/50">+{money(r.pipeline)} por cobrar</span> : null}
                </td>
                <td className="py-sp-2 pr-sp-3 text-xs">
                  {r.topPost ? (
                    <>
                      <strong className="font-mono">{r.topPost.er}%</strong> · {r.topPost.views.toLocaleString("es")} vistas
                      <span className="block max-w-[220px] truncate text-ink/55" title={r.topPost.caption}>
                        {r.topPost.url ? (
                          <a href={r.topPost.url} target="_blank" rel="noreferrer" className="hover:text-coral">
                            {r.topPost.caption}
                          </a>
                        ) : (
                          r.topPost.caption
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink/40">Sin métricas</span>
                  )}
                </td>
                <td className="py-sp-2 text-ink/60">{date(r.lastLoginAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-sp-3 text-xs text-ink/50">
        Engagement = (likes + comentarios + compartidos + guardados) ÷ vistas. Solo cuentan publicaciones con 100 vistas o más.
      </p>
    </Card>
  );
}
