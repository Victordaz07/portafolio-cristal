"use client";

import { useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

export interface BrandFormValues {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  active: boolean;
}

export default function BrandForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: BrandFormValues;
  submitLabel: string;
  onSubmit: (values: BrandFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<BrandFormValues>(
    initial ?? { name: "", logoUrl: "", websiteUrl: "", active: true }
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onSubmit(values);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Nombre</span>
        <input
          required
          value={values.name}
          onChange={(e) => setValues((c) => ({ ...c, name: e.target.value }))}
          className={inputClass}
        />
      </label>

      <ImageUploadField
        label="Logo (opcional)"
        value={values.logoUrl}
        onChange={(url) => setValues((c) => ({ ...c, logoUrl: url }))}
      />

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Sitio web (opcional)</span>
        <input
          type="url"
          value={values.websiteUrl}
          onChange={(e) => setValues((c) => ({ ...c, websiteUrl: e.target.value }))}
          className={inputClass}
          placeholder="https://..."
        />
        <span className="text-xs text-ink/50">Si lo agregas, el logo será clickeable en el sitio.</span>
      </label>

      <label className="flex items-center gap-sp-2">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(e) => setValues((c) => ({ ...c, active: e.target.checked }))}
        />
        <span className="text-sm text-ink">Activa (visible en el sitio público)</span>
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
