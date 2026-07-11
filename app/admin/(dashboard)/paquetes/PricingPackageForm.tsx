"use client";

import { useState } from "react";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

export interface PricingPackageFormValues {
  name: string;
  price: string;
  unit: string;
  deliverables: string[];
  featured: boolean;
}

export default function PricingPackageForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: PricingPackageFormValues;
  submitLabel: string;
  onSubmit: (values: PricingPackageFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<PricingPackageFormValues>(
    initial ?? { name: "", price: "", unit: "", deliverables: [""], featured: false }
  );
  const [saving, setSaving] = useState(false);

  function updateDeliverable(index: number, text: string) {
    setValues((current) => ({
      ...current,
      deliverables: current.deliverables.map((item, i) => (i === index ? text : item)),
    }));
  }

  function addDeliverable() {
    setValues((current) => ({ ...current, deliverables: [...current.deliverables, ""] }));
  }

  function removeDeliverable(index: number) {
    setValues((current) => ({
      ...current,
      deliverables: current.deliverables.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onSubmit({
      ...values,
      deliverables: values.deliverables.map((item) => item.trim()).filter(Boolean),
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <div className="grid gap-sp-4 sm:grid-cols-3">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Nombre</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((c) => ({ ...c, name: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Precio</span>
          <input
            required
            value={values.price}
            onChange={(e) => setValues((c) => ({ ...c, price: e.target.value }))}
            className={inputClass}
            placeholder="$45"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Unidad</span>
          <input
            required
            value={values.unit}
            onChange={(e) => setValues((c) => ({ ...c, unit: e.target.value }))}
            className={inputClass}
            placeholder="/ video"
          />
        </label>
      </div>

      <div className="flex flex-col gap-sp-2">
        <span className="text-sm font-medium text-ink">Entregables</span>
        {values.deliverables.map((item, index) => (
          <div key={index} className="flex gap-sp-2">
            <input
              value={item}
              onChange={(e) => updateDeliverable(index, e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeDeliverable(index)}
              className="px-sp-2 text-red-600"
              aria-label="Quitar línea"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addDeliverable}
          className="self-start text-sm text-coral hover:underline"
        >
          + agregar línea
        </button>
      </div>

      <label className="flex items-center gap-sp-2">
        <input
          type="checkbox"
          checked={values.featured}
          onChange={(e) => setValues((c) => ({ ...c, featured: e.target.checked }))}
        />
        <span className="text-sm text-ink">Paquete destacado (&quot;Más pedido&quot;)</span>
      </label>

      <div className="flex gap-sp-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Guardando..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
