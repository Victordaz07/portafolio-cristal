"use client";

import { useState } from "react";
import type { Stat } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass, rowCardClass, cardClass, dangerLinkClass } from "@/lib/admin-ui";
import { STAT_ICONS, STAT_ICON_OPTIONS, StarIcon, type StatIconKey } from "@/components/icons";
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

const API_BASE = "/api/admin/stats";

export default function StatsManager({ initialStats }: { initialStats: Stat[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const [stats, setStats] = useState(initialStats);
  const [label, setLabel] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [value, setValue] = useState("");
  const [icon, setIcon] = useState<StatIconKey>("star");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Stat | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, labelEn, value, icon }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? t("No se pudo agregar el número", "Couldn't add the stat"));
      return;
    }

    const created: Stat = await response.json();
    setStats((current) => [...current, created]);
    setLabel("");
    setLabelEn("");
    setValue("");
    setIcon("star");
    showToast("success", t("Número agregado", "Stat added"));
  }

  async function handleIconChange(stat: Stat, nextIcon: StatIconKey) {
    setStats((current) => current.map((s) => (s.id === stat.id ? { ...s, icon: nextIcon } : s)));
    const response = await fetch(`${API_BASE}/${stat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon: nextIcon }),
    });
    if (!response.ok) {
      showToast("error", t("No se pudo actualizar el ícono", "Couldn't update the icon"));
    }
  }

  async function handleDelete(stat: Stat) {
    const response = await fetch(`${API_BASE}/${stat.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", t("No se pudo eliminar", "Couldn't delete"));
      return;
    }
    setStats((current) => current.filter((item) => item.id !== stat.id));
    showToast("success", t("Número eliminado", "Stat deleted"));
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(stats, index, direction, API_BASE);
    setStats(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {stats.map((stat, index) => (
          <li key={stat.id} className={rowCardClass}>
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === stats.length - 1}
            />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime/30 text-coral">
              {(() => {
                const Icon = STAT_ICONS[stat.icon as StatIconKey] ?? StarIcon;
                return <Icon className="h-4 w-4" />;
              })()}
            </span>
            <div className="flex-1">
              <p className="font-mono font-bold text-lg text-moss">{stat.value}</p>
              <p className="text-xs uppercase tracking-wide text-ink/60">
                {(lang === "en" && stat.labelEn) || stat.label}
                {stat.labelEn && <span className="text-ink/40"> · {stat.labelEn}</span>}
              </p>
            </div>
            <select
              value={stat.icon}
              onChange={(e) => handleIconChange(stat, e.target.value as StatIconKey)}
              className="rounded-md border border-line px-sp-2 py-sp-1 text-sm text-ink"
            >
              {STAT_ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {pickLabel(lang, option)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPendingDelete(stat)}
              className={dangerLinkClass}
            >
              {t("Eliminar", "Delete")}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className={`${cardClass} mt-sp-6 flex flex-wrap items-end gap-sp-3`}>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Número", "Number")}</span>
          <input
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
            placeholder="24.5K"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Etiqueta (español)", "Label (Spanish)")}</span>
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
            placeholder={t("Seguidores", "Seguidores")}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Etiqueta (inglés)", "Label (English)")}</span>
          <input
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            className={inputClass}
            placeholder="Followers"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Ícono", "Icon")}</span>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value as StatIconKey)}
            className={inputClass}
          >
            {STAT_ICON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {pickLabel(lang, option)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? t("Agregando...", "Adding...") : t("+ agregar número", "+ add stat")}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title={t("Eliminar número", "Delete stat")}
          description={t(`¿Eliminar "${pendingDelete.label}"? Esta acción no se puede deshacer.`, `Delete "${pendingDelete.label}"? This can't be undone.`)}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
