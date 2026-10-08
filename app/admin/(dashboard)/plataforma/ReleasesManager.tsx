"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { NEW_BADGE_DAYS, RELEASE_LEVELS, levelLabel, type ReleaseLevel } from "@/lib/releases";

export interface ReleaseRow {
  id: string;
  season: number;
  name: string;
  description: string;
  note: string | null;
  level: ReleaseLevel;
  isNew: boolean;
}

export interface SeasonRow {
  id: number;
  name: string;
  description: string;
}

// Colores de cada posición: Apagado (tinta), Embajadores (acento oscuro), Todos (verde oliva).
const SELECTED: Record<ReleaseLevel, string> = { off: "bg-ink text-white", amb: "bg-moss text-white", all: "bg-cobalt text-white" };
const DOT: Record<ReleaseLevel, string> = { off: "bg-ink/30", amb: "bg-coral", all: "bg-cobalt" };

/** Centro de mando → Lanzamientos: un selector Apagado / Embajadores / Todos por módulo, agrupado por temporadas. */
export default function ReleasesManager({ seasons, modules }: { seasons: SeasonRow[]; modules: ReleaseRow[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState(modules);
  const [saving, setSaving] = useState(false);

  const counts = { off: 0, amb: 0, all: 0 } as Record<ReleaseLevel, number>;
  for (const r of rows) counts[r.level]++;

  async function apply(ids: string[], level: ReleaseLevel, what: string) {
    const targets = ids.filter((id) => rows.find((r) => r.id === id)?.level !== level);
    if (!targets.length || saving) return;
    const before = rows;
    setRows((prev) => prev.map((r) => (targets.includes(r.id) ? { ...r, level, isNew: level === "all" ? r.isNew || r.level !== "all" : false } : r)));
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform/releases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targets, level }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t("No se pudo guardar", "Couldn't save"));
      showToast("success", t(`Guardado: ${what} → ${levelLabel(level, "es")}`, `Saved: ${what} → ${levelLabel(level, "en")}`));
      // El menú lateral de esta pestaña también cambia (tus etiquetas «Apagado» / «Anticipado»).
      router.refresh();
    } catch (error) {
      setRows(before);
      showToast("error", error instanceof Error ? error.message : t("No se pudo guardar", "Couldn't save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-sp-6">
      <Card>
        <h2 className="font-fraunces text-2xl font-medium">
          {t("Lanzamiento por", "Release by")} <span className="italic text-moss">{t("temporadas", "seasons")}</span>
        </h2>
        <p className="mt-sp-2 max-w-2xl text-sm text-ink/60">
          {t(
            "Decide quién ve cada módulo. El cambio se aplica al instante y queda en el historial. Apagar un módulo solo lo esconde: los datos de cada cuenta se guardan. Tú lo ves todo, con su etiqueta, para poder revisarlo.",
            "Decide who sees each module. Changes apply instantly and are logged. Turning a module off only hides it: every account's data is kept. You see everything, with its tag, so you can review it."
          )}
        </p>
        <div className="mt-sp-4 grid grid-cols-1 gap-sp-3 sm:grid-cols-3">
          {RELEASE_LEVELS.map((level) => (
            <div key={level} className="rounded-[14px] border border-line px-sp-4 py-sp-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">{levelLabel(level, lang)}</p>
              <p className="font-fraunces text-3xl">{counts[level]}</p>
              <p className="text-xs text-ink/60">
                {level === "off"
                  ? t("No sale en el menú de nadie", "Not in anyone's menu")
                  : level === "amb"
                    ? t("Con la etiqueta «Anticipado»", "Tagged “Early”")
                    : t("Toda cuenta activa lo ve", "Every active account sees it")}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-sp-3 text-xs text-ink/60">
          {t(
            "Siempre visibles, no se apagan: Resumen, Manual de uso, Soporte, Ideas, Mi plan y Mi cuenta.",
            "Always visible, can't be turned off: Overview, User guide, Support, Ideas, My plan and My account."
          )}
        </p>
      </Card>

      {seasons.map((season) => {
        const items = rows.filter((r) => r.season === season.id);
        return (
          <section key={season.id} className="flex flex-col gap-sp-3" aria-labelledby={`temporada-${season.id}`}>
            <div className="flex flex-wrap items-end justify-between gap-sp-3">
              <div className="min-w-0 flex-[999_1_420px]">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t(`Temporada ${season.id}`, `Season ${season.id}`)}</p>
                <h3 id={`temporada-${season.id}`} className="font-fraunces text-2xl font-medium">{season.name}</h3>
                <p className="text-sm text-ink/60">{season.description}</p>
              </div>
              <div className="flex flex-[1_1_300px] flex-col gap-1.5">
                <span className="text-xs text-ink/60">{t("Toda la temporada:", "Whole season:")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {RELEASE_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={saving}
                      onClick={() => apply(items.map((i) => i.id), level, t(`Temporada ${season.id} completa`, `All of season ${season.id}`))}
                      className="min-h-9 rounded-full border border-dashed border-ink/25 px-sp-3 py-1 text-[13px] text-ink hover:border-coral disabled:opacity-50"
                    >
                      {levelLabel(level, lang)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-line bg-white">
              {items.map((m, index) => (
                <div key={m.id} className={`flex flex-wrap items-center gap-x-sp-5 gap-y-sp-3 px-sp-5 py-sp-4 ${index ? "border-t border-line/70" : ""}`}>
                  <div className="flex min-w-0 flex-[999_1_420px] items-start gap-sp-3">
                    <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[m.level]}`} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-sp-2">
                        <span className="font-semibold">{m.name}</span>
                        {m.level === "amb" && (
                          <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[11px] font-semibold text-moss">{t("Acceso anticipado", "Early access")}</span>
                        )}
                        {m.level === "all" && m.isNew && (
                          <span className="rounded-full bg-cobalt/10 px-2 py-0.5 text-[11px] font-semibold text-cobalt">{t("Nuevo", "New")}</span>
                        )}
                      </div>
                      <p className="text-[13px] text-ink/60">{m.description}</p>
                      {m.note && <p className="mt-0.5 text-xs text-[#8A5A00]">{m.note}</p>}
                    </div>
                  </div>
                  <div role="group" aria-label={t(`Quién ve ${m.name}`, `Who sees ${m.name}`)} className="flex max-w-[380px] flex-[1_1_330px] gap-1 rounded-full bg-ink/5 p-1">
                    {RELEASE_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={m.level === level}
                        disabled={saving}
                        onClick={() => apply([m.id], level, m.name)}
                        className={`min-h-10 flex-1 whitespace-nowrap rounded-full px-2.5 text-[13px] font-semibold transition disabled:cursor-wait ${
                          m.level === level ? SELECTED[level] : "text-ink/60 hover:bg-white"
                        }`}
                      >
                        {levelLabel(level, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-ink/60">
        {t(
          `Al pasar un módulo a «Todos», las cuentas que lo tenían en acceso anticipado no notan nada; el resto lo ve aparecer en su menú con la etiqueta «Nuevo» durante ${NEW_BADGE_DAYS} días.`,
          `When a module moves to “Everyone”, accounts that had early access notice nothing; everyone else sees it appear in their menu tagged “New” for ${NEW_BADGE_DAYS} days.`
        )}
      </p>
    </div>
  );
}
