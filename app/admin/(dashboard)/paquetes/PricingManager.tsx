"use client";

import { useState } from "react";
import type { PricingPackage } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import PricingPackageForm, { type PricingPackageFormValues } from "./PricingPackageForm";

const API_BASE = "/api/admin/pricing-packages";

export default function PricingManager({
  initialPackages,
}: {
  initialPackages: PricingPackage[];
}) {
  const { showToast } = useToast();
  const [packages, setPackages] = useState(initialPackages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PricingPackage | null>(null);

  async function handleCreate(values: PricingPackageFormValues) {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo crear el paquete");
      return;
    }

    const created: PricingPackage = await response.json();
    setPackages((current) => [...current, created]);
    setShowCreate(false);
    showToast("success", "Paquete creado");
  }

  async function handleUpdate(id: string, values: PricingPackageFormValues) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo actualizar el paquete");
      return;
    }

    const updated: PricingPackage = await response.json();
    setPackages((current) => current.map((pkg) => (pkg.id === id ? updated : pkg)));
    setEditingId(null);
    showToast("success", "Paquete actualizado");
  }

  async function handleDelete(pkg: PricingPackage) {
    const response = await fetch(`${API_BASE}/${pkg.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setPackages((current) => current.filter((item) => item.id !== pkg.id));
    showToast("success", "Paquete eliminado");
  }

  return (
    <div>
      <div className="flex flex-col gap-sp-4">
        {packages.map((pkg) =>
          editingId === pkg.id ? (
            <div key={pkg.id} className="rounded-md border border-line bg-white p-sp-5">
              <PricingPackageForm
                initial={{
                  name: pkg.name,
                  price: pkg.price,
                  unit: pkg.unit,
                  deliverables: pkg.deliverables,
                  featured: pkg.featured,
                }}
                submitLabel="Guardar cambios"
                onSubmit={(values) => handleUpdate(pkg.id, values)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={pkg.id}
              className="flex items-start justify-between gap-sp-4 rounded-md border border-line bg-white p-sp-5"
            >
              <div>
                <p className="font-bodoni italic font-bold uppercase text-ink">
                  {pkg.name} {pkg.featured && <span className="text-coral">★</span>}
                </p>
                <p className="font-mono font-bold text-moss">
                  {pkg.price} <span className="text-xs font-normal">{pkg.unit}</span>
                </p>
                <ul className="mt-sp-2 text-sm text-ink/70">
                  {pkg.deliverables.map((item) => (
                    <li key={item}>→ {item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-col gap-sp-2 text-sm">
                <button
                  type="button"
                  onClick={() => setEditingId(pkg.id)}
                  className="text-coral hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(pkg)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-sp-6">
        {showCreate ? (
          <div className="rounded-md border border-line bg-white p-sp-5">
            <PricingPackageForm
              submitLabel="Crear paquete"
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
            + agregar paquete
          </button>
        )}
      </div>

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
