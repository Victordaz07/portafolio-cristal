"use client";

import { useState } from "react";
import type { Brand } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/brands";

export default function BrandsManager({ initialBrands }: { initialBrands: Brand[] }) {
  const { showToast } = useToast();
  const [brands, setBrands] = useState(initialBrands);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Brand | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, logoUrl }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo agregar la marca");
      return;
    }

    const created: Brand = await response.json();
    setBrands((current) => [...current, created]);
    setName("");
    setLogoUrl("");
    showToast("success", "Marca agregada");
  }

  async function handleDelete(brand: Brand) {
    const response = await fetch(`${API_BASE}/${brand.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setBrands((current) => current.filter((item) => item.id !== brand.id));
    showToast("success", "Marca eliminada");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(brands, index, direction, API_BASE);
    setBrands(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {brands.map((brand, index) => (
          <li
            key={brand.id}
            className="flex items-center gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
          >
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === brands.length - 1}
            />
            {brand.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt="" className="h-8 w-8 object-contain" />
            )}
            <p className="flex-1 text-ink">{brand.name}</p>
            <button
              type="button"
              onClick={() => setPendingDelete(brand)}
              className="text-sm text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-sp-6 flex flex-col gap-sp-4 max-w-sm">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Nombre</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <ImageUploadField label="Logo (opcional)" value={logoUrl} onChange={setLogoUrl} />
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? "Agregando..." : "+ agregar marca"}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar marca"
          description={`¿Eliminar "${pendingDelete.name}"?`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
