"use client";

import { useState } from "react";
import type { Brand } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { swapOrder } from "@/lib/reorder";
import BrandForm, { type BrandFormValues } from "./BrandForm";

const API_BASE = "/api/admin/brands";

function toFormValues(brand: Brand): BrandFormValues {
  return {
    name: brand.name,
    logoUrl: brand.logoUrl ?? "",
    websiteUrl: brand.websiteUrl ?? "",
    active: brand.active,
  };
}

export default function BrandsManager({ initialBrands }: { initialBrands: Brand[] }) {
  const { showToast } = useToast();
  const [brands, setBrands] = useState(initialBrands);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function handleCreate(values: BrandFormValues) {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo agregar la marca");
      return;
    }

    const created: Brand = await response.json();
    setBrands((current) => [...current, created]);
    setShowCreate(false);
    showToast("success", "Marca agregada");
  }

  async function handleUpdate(id: string, values: BrandFormValues) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo actualizar la marca");
      return;
    }

    const updated: Brand = await response.json();
    setBrands((current) => current.map((brand) => (brand.id === id ? updated : brand)));
    setEditingId(null);
    showToast("success", "Marca actualizada");
  }

  async function handleToggleActive(brand: Brand) {
    const response = await fetch(`${API_BASE}/${brand.id}`, {
      method: brand.active ? "DELETE" : "PATCH",
      headers: brand.active ? undefined : { "Content-Type": "application/json" },
      body: brand.active ? undefined : JSON.stringify({ active: true }),
    });

    if (!response.ok) {
      showToast("error", "No se pudo actualizar el estado");
      return;
    }

    const updated: Brand = await response.json();
    setBrands((current) => current.map((item) => (item.id === brand.id ? updated : item)));
    showToast("success", updated.active ? "Marca activada" : "Marca desactivada");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(brands, index, direction, API_BASE);
    setBrands(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {brands.map((brand, index) =>
          editingId === brand.id ? (
            <li key={brand.id} className="rounded-md border border-line bg-white p-sp-5">
              <BrandForm
                initial={toFormValues(brand)}
                submitLabel="Guardar cambios"
                onSubmit={(values) => handleUpdate(brand.id, values)}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
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
              <div className="flex-1">
                <p className="text-ink">{brand.name}</p>
                {!brand.active && (
                  <span className="text-xs uppercase tracking-wide text-ink/50">Inactiva</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingId(brand.id)}
                className="text-sm text-coral hover:underline"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleToggleActive(brand)}
                className="text-sm text-ink/70 hover:underline"
              >
                {brand.active ? "Desactivar" : "Activar"}
              </button>
            </li>
          )
        )}
      </ul>

      <div className="mt-sp-6">
        {showCreate ? (
          <div className="rounded-md border border-line bg-white p-sp-5 max-w-sm">
            <BrandForm
              submitLabel="Agregar marca"
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="text-sm text-coral hover:underline"
          >
            + agregar marca
          </button>
        )}
      </div>
    </div>
  );
}
