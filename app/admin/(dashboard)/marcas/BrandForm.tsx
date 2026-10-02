"use client";

import { useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { CRM_PLATFORMS, DEAL_STATUSES, DEAL_STATUS_META, type DealStatus } from "@/lib/crm";

export interface BrandFormValues {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  active: boolean;
  dealStatus: DealStatus | "";
  contactName: string;
  contactEmail: string;
  dealValue: string;
  packageDetail: string;
  platforms: string[];
  nextAction: string;
  nextActionDue: string;
  lastContactAt: string;
}

export const emptyBrandForm: BrandFormValues = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  // Un prospecto nuevo no debería aparecer en el sitio público hasta que se decida.
  active: false,
  dealStatus: "prospect",
  contactName: "",
  contactEmail: "",
  dealValue: "",
  packageDetail: "",
  platforms: [],
  nextAction: "",
  nextActionDue: "",
  lastContactAt: "",
};

/** Valores del formulario → cuerpo JSON para la API. */
export function toBrandPayload(values: BrandFormValues) {
  const dealValue = values.dealValue.trim() === "" ? null : Number(values.dealValue);
  return {
    ...values,
    dealStatus: values.dealStatus || null,
    dealValue: Number.isFinite(dealValue) ? dealValue : null,
  };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-sp-1">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink/50">{hint}</span>}
    </label>
  );
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
  const [values, setValues] = useState<BrandFormValues>(initial ?? emptyBrandForm);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof BrandFormValues>(key: K, value: BrandFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const hasDeal = values.dealStatus !== "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onSubmit(values);
    setSaving(false);
  }

  function togglePlatform(platform: string) {
    set(
      "platforms",
      values.platforms.includes(platform)
        ? values.platforms.filter((p) => p !== platform)
        : [...values.platforms, platform]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-5">
      <div className="grid gap-sp-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input required value={values.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Estado del trato">
          <select
            value={values.dealStatus}
            onChange={(e) => set("dealStatus", e.target.value as BrandFormValues["dealStatus"])}
            className={inputClass}
          >
            <option value="">Sin trato (solo portafolio)</option>
            {DEAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {DEAL_STATUS_META[status].label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {hasDeal && (
        <fieldset className="flex flex-col gap-sp-4 rounded-[14px] border border-line bg-cream/60 p-sp-4">
          <legend className="px-sp-1 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">
            Datos del trato
          </legend>
          <div className="grid gap-sp-4 sm:grid-cols-2">
            <Field label="Contacto">
              <input
                value={values.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                className={inputClass}
                placeholder="Nombre de la persona"
              />
            </Field>
            <Field label="Email del contacto">
              <input
                type="email"
                value={values.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                className={inputClass}
                placeholder="nombre@marca.com"
              />
            </Field>
            <Field label="Valor del trato (USD)">
              <input
                type="number"
                min={0}
                step={1}
                value={values.dealValue}
                onChange={(e) => set("dealValue", e.target.value)}
                className={inputClass}
                placeholder="1200"
              />
            </Field>
            <Field label="Paquete" hint="Qué vas a entregar, ej: 2 reels + 1 historia/mes">
              <input
                value={values.packageDetail}
                onChange={(e) => set("packageDetail", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Próximo paso">
              <input
                value={values.nextAction}
                onChange={(e) => set("nextAction", e.target.value)}
                className={inputClass}
                placeholder="Enviar media kit"
              />
            </Field>
            <Field label="Fecha límite del próximo paso">
              <input
                type="date"
                value={values.nextActionDue}
                onChange={(e) => set("nextActionDue", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Último contacto">
              <input
                type="date"
                value={values.lastContactAt}
                onChange={(e) => set("lastContactAt", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-sp-2">
            <span className="text-sm font-medium text-ink">Plataformas</span>
            <div className="flex flex-wrap gap-sp-2">
              {CRM_PLATFORMS.map((platform) => {
                const selected = values.platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      selected ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink/70 hover:border-coral"
                    }`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>
      )}

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <ImageUploadField label="Logo (opcional)" value={values.logoUrl} onChange={(url) => set("logoUrl", url)} />
        <div className="flex flex-col gap-sp-4">
          <Field label="Sitio web (opcional)" hint="Si lo agregas, el logo será clickeable en el sitio.">
            <input
              type="url"
              value={values.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </Field>
          <label className="flex items-center gap-sp-2">
            <input type="checkbox" checked={values.active} onChange={(e) => set("active", e.target.checked)} />
            <span className="text-sm text-ink">Mostrar el logo en el carrusel del sitio público</span>
          </label>
        </div>
      </div>

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
