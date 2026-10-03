import Link from "next/link";
import { HEATMAP_DAYS, HEATMAP_SLOTS } from "@/lib/reports";
import { formatCompact } from "@/lib/metrics";

// Piezas visuales del centro de mando (sin librería de gráficos, mismo lenguaje que Reportes).

export const eyebrowClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "creadores", label: "Creadores" },
  { id: "contenido", label: "Contenido" },
  { id: "nichos", label: "Nichos" },
  { id: "inteligencia", label: "Inteligencia" },
  { id: "cuentas", label: "Cuentas" },
];

export function PlatformTabs({ active }: { active: string }) {
  return (
    <nav aria-label="Secciones del centro de mando" className="flex flex-wrap gap-sp-2">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.id === "resumen" ? "/admin/plataforma" : `/admin/plataforma?vista=${t.id}`}
          aria-current={active === t.id ? "page" : undefined}
          className={`rounded-full px-sp-4 py-1.5 text-sm font-semibold transition ${
            active === t.id ? "bg-ink text-cream" : "border border-line bg-white text-ink/70 hover:border-coral hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Barras verticales de una sola serie (p. ej. altas por semana), con el valor al pasar el mouse. */
export function WeeklyBars({ data, unit }: { data: { label: string; count: number }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 border-b border-line" role="img" aria-label={`${total} ${unit} en ${data.length} semanas`}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] text-cream group-hover:block">
              {d.count} · {d.label}
            </span>
            <span
              className="mx-auto w-full max-w-[28px] rounded-t-[4px] bg-coral transition group-hover:bg-ink"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 font-mono text-[9px] text-ink/45">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 text-center">
            {i % 2 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface BarRow {
  key: string;
  label: string;
  value: number;
  detail: string;
}

/** Barras horizontales comparando un valor (engagement mediano) entre grupos. */
export function BarList({ rows, suffix = "%" }: { rows: BarRow[]; suffix?: string }) {
  if (!rows.length) return <p className="text-sm text-ink/55">Todavía no hay datos suficientes.</p>;
  const max = Math.max(...rows.map((r) => r.value), 0.1);
  return (
    <ul className="flex flex-col gap-sp-3">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[110px_1fr_auto] items-center gap-sp-3 text-sm sm:grid-cols-[140px_1fr_auto]">
          <span className="truncate text-ink" title={r.label}>
            {r.label}
          </span>
          <span className="h-2.5 rounded-full bg-cream" title={r.detail}>
            <span className="block h-full rounded-full bg-coral" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right">
            <strong className="font-mono text-ink">
              {r.value}
              {suffix}
            </strong>
            <span className="block text-[11px] text-ink/50">{r.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const HEAT_STEPS = ["bg-coral/15", "bg-coral/35", "bg-coral/60", "bg-coral/85"];

/** Mapa día × franja con el engagement mediano de todas las cuentas. */
export function EngagementHeatmap({ grid }: { grid: ({ median: number; count: number } | null)[][] }) {
  const values = grid.flat().filter((c): c is { median: number; count: number } => !!c).map((c) => c.median);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (v: number) => (max === min ? 2 : Math.min(3, Math.floor(((v - min) / (max - min)) * 4)));
  return (
    <div>
      <div className="grid grid-cols-[48px_repeat(4,1fr)] gap-1 text-center">
        <span />
        {HEATMAP_SLOTS.map((s) => (
          <span key={s.label} className="pb-1 font-mono text-[10px] uppercase text-ink/50">
            {s.label}
            <span className="block normal-case text-ink/35">{s.hint}</span>
          </span>
        ))}
        {HEATMAP_DAYS.map((day, d) => (
          <div key={day} className="contents">
            <span className="self-center text-left text-xs font-semibold text-ink/70">{day}</span>
            {grid[d].map((cell, s) => (
              <span
                key={s}
                title={cell ? `${day}, ${HEATMAP_SLOTS[s].label}: ${cell.median}% de engagement mediano (${cell.count} publicaciones)` : "Sin publicaciones"}
                className={`rounded-[6px] py-2 font-mono text-[11px] ${
                  cell ? `${HEAT_STEPS[step(cell.median)]} ${step(cell.median) >= 2 ? "text-white" : "text-ink"}` : "bg-cream text-ink/25"
                }`}
              >
                {cell ? `${cell.median}%` : "—"}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-sp-2 flex items-center gap-sp-2 text-[11px] text-ink/50">
        <span>Menos engagement</span>
        {HEAT_STEPS.map((c) => (
          <span key={c} className={`h-3 w-6 rounded ${c}`} />
        ))}
        <span>Más engagement</span>
      </div>
    </div>
  );
}

export function Stat({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-white p-sp-4">
      <p className="font-fraunces text-3xl font-semibold text-coral">{value}</p>
      <p className="mt-sp-1 text-sm text-ink/70">{label}</p>
      {sub && <p className="text-xs text-ink/45">{sub}</p>}
    </div>
  );
}

export const compact = formatCompact;
