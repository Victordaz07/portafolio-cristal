"use client";

import { useState } from "react";
import type { StatModel as Stat } from "@/lib/generated/prisma/models";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/stats";

export default function StatsManager({ initialStats }: { initialStats: Stat[] }) {
  const { showToast } = useToast();
  const [stats, setStats] = useState(initialStats);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Stat | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, value }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo agregar el stat");
      return;
    }

    const created: Stat = await response.json();
    setStats((current) => [...current, created]);
    setLabel("");
    setValue("");
    showToast("success", "Stat agregado");
  }

  async function handleDelete(stat: Stat) {
    const response = await fetch(`${API_BASE}/${stat.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setStats((current) => current.filter((item) => item.id !== stat.id));
    showToast("success", "Stat eliminado");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(stats, index, direction, API_BASE);
    setStats(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {stats.map((stat, index) => (
          <li
            key={stat.id}
            className="flex items-center gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
          >
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === stats.length - 1}
            />
            <div className="flex-1">
              <p className="font-mono font-bold text-lg text-moss">{stat.value}</p>
              <p className="text-xs uppercase tracking-wide text-ink/60">{stat.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setPendingDelete(stat)}
              className="text-sm text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-sp-6 flex flex-wrap items-end gap-sp-3">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Número</span>
          <input
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
            placeholder="24.5K"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Label</span>
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
            placeholder="Seguidores"
          />
        </label>
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Agregando..." : "+ agregar stat"}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar stat"
          description={`¿Eliminar "${pendingDelete.label}"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
