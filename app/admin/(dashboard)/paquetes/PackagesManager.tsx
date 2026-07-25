"use client";

import { useState } from "react";
import type { Package } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/packages";

const EMPTY = { emoji: "✨", name: "", itemsText: "" };

function toItems(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PackagesManager({ initialPackages }: { initialPackages: Package[] }) {
  const { showToast } = useToast();
  const [packages, setPackages] = useState(initialPackages);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Package | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const items = toItems(form.itemsText);
    if (items.length === 0) {
      showToast("error", "Agrega al menos un ítem");
      return;
    }

    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: form.emoji, name: form.name, items }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo agregar el paquete");
      return;
    }

    const created: Package = await response.json();
    setPackages((current) => [...current, created]);
    setForm(EMPTY);
    showToast("success", "Paquete agregado");
  }

  async function handleDelete(pkg: Package) {
    const response = await fetch(`${API_BASE}/${pkg.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setPackages((current) => current.filter((item) => item.id !== pkg.id));
    showToast("success", "Paquete eliminado");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(packages, index, direction, API_BASE);
    setPackages(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {packages.map((pkg, index) => (
          <li
            key={pkg.id}
            className="flex items-start gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
          >
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === packages.length - 1}
            />
            <div className="flex-1">
              <p className="font-medium text-ink">
                {pkg.emoji} {pkg.name}
              </p>
              <ul className="mt-sp-1 list-disc pl-sp-5 text-sm text-ink/60">
                {pkg.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setPendingDelete(pkg)}
              className="text-sm text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-sp-6 flex flex-col gap-sp-4 max-w-lg">
        <div className="grid gap-sp-4 sm:grid-cols-[80px_1fr]">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Emoji</span>
            <input
              value={form.emoji}
              onChange={(e) => setForm((c) => ({ ...c, emoji: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Nombre del paquete</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Qué incluye (un ítem por línea)</span>
          <textarea
            required
            rows={5}
            value={form.itemsText}
            onChange={(e) => setForm((c) => ({ ...c, itemsText: e.target.value }))}
            className={inputClass}
          />
        </label>
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? "Agregando..." : "+ agregar paquete"}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar paquete"
          description={`¿Eliminar "${pendingDelete.name}"?`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
