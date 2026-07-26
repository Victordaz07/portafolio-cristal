"use client";

import { useState } from "react";
import type { Package } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/packages";

const EMPTY = { emoji: "✨", name: "", nameEn: "", itemsText: "", itemsTextEn: "" };

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
      body: JSON.stringify({
        emoji: form.emoji,
        name: form.name,
        nameEn: form.nameEn,
        items,
        itemsEn: toItems(form.itemsTextEn),
      }),
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
                {pkg.nameEn && <span className="text-ink/40"> · {pkg.nameEn}</span>}
              </p>
              <ul className="mt-sp-1 list-disc pl-sp-5 text-sm text-ink/60">
                {pkg.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
              {pkg.itemsEn.length > 0 && (
                <ul className="mt-sp-1 list-disc pl-sp-5 text-sm text-ink/40">
                  {pkg.itemsEn.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
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
          <BilingualTextField
            label="Nombre del paquete"
            es={form.name}
            en={form.nameEn}
            onEsChange={(v) => setForm((c) => ({ ...c, name: v }))}
            onEnChange={(v) => setForm((c) => ({ ...c, nameEn: v }))}
            required
          />
        </div>
        <BilingualTextField
          label="Qué incluye (un ítem por línea)"
          es={form.itemsText}
          en={form.itemsTextEn}
          onEsChange={(v) => setForm((c) => ({ ...c, itemsText: v }))}
          onEnChange={(v) => setForm((c) => ({ ...c, itemsTextEn: v }))}
          multiline
          rows={5}
          required
        />
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
