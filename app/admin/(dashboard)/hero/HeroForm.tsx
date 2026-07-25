"use client";

import { useState } from "react";
import type { Hero } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";

type HeroFormValues = Omit<Hero, "id" | "updatedAt" | "photoUrl" | "photoUrlMobile"> & {
  photoUrl: string;
  photoUrlMobile: string;
};

const EMPTY: HeroFormValues = {
  name: "",
  location: "",
  niche: "",
  badgeLabel: "",
  headlinePlain: "",
  headlineEmphasis: "",
  headlineSuffix: "",
  description: "",
  photoUrl: "",
  photoUrlMobile: "",
  ctaPrimaryLabel: "",
  ctaPrimaryHref: "",
  ctaSecondaryLabel: "",
  ctaSecondaryHref: "",
};

export default function HeroForm({ initialHero }: { initialHero: Hero | null }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(
    initialHero
      ? {
          name: initialHero.name,
          location: initialHero.location,
          niche: initialHero.niche,
          badgeLabel: initialHero.badgeLabel,
          headlinePlain: initialHero.headlinePlain,
          headlineEmphasis: initialHero.headlineEmphasis,
          headlineSuffix: initialHero.headlineSuffix,
          description: initialHero.description,
          photoUrl: initialHero.photoUrl ?? "",
          photoUrlMobile: initialHero.photoUrlMobile ?? "",
          ctaPrimaryLabel: initialHero.ctaPrimaryLabel,
          ctaPrimaryHref: initialHero.ctaPrimaryHref,
          ctaSecondaryLabel: initialHero.ctaSecondaryLabel,
          ctaSecondaryHref: initialHero.ctaSecondaryHref,
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (response.ok) {
      showToast("success", "Hero actualizado");
    } else {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo guardar");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-sp-5">
      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">Nombre</span>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">Ubicación</span>
          <input
            required
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span className="text-sm font-medium text-ink">Nicho</span>
        <input
          required
          value={form.niche}
          onChange={(e) => set("niche", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        <span className="text-sm font-medium text-ink">Badge (pill arriba del título)</span>
        <input
          required
          value={form.badgeLabel}
          onChange={(e) => set("badgeLabel", e.target.value)}
          className={inputClass}
          placeholder="UGC Creator • Brand Reviews"
        />
      </label>

      <div className="grid gap-sp-4 sm:grid-cols-3">
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">Título — línea 1</span>
          <input
            required
            value={form.headlinePlain}
            onChange={(e) => set("headlinePlain", e.target.value)}
            className={inputClass}
            placeholder="Reseñas que"
          />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">Título — palabra en color</span>
          <input
            required
            value={form.headlineEmphasis}
            onChange={(e) => set("headlineEmphasis", e.target.value)}
            className={inputClass}
            placeholder="inspiran"
          />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">Título — resto de la línea 2</span>
          <input
            value={form.headlineSuffix}
            onChange={(e) => set("headlineSuffix", e.target.value)}
            className={inputClass}
            placeholder="confianza."
          />
        </label>
      </div>

      <label className={labelClass}>
        <span className="text-sm font-medium text-ink">Descripción</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
          placeholder="Creo reseñas **auténticas y contenido UGC** que conecta..."
        />
        <span className="text-xs text-ink/50">
          Usa **texto** para negrita oscura y __texto__ para negrita en color de acento.
        </span>
      </label>

      <ImageUploadField
        label="Foto (escritorio)"
        value={form.photoUrl}
        onChange={(url) => set("photoUrl", url)}
      />

      <ImageUploadField
        label="Foto (mobile)"
        value={form.photoUrlMobile}
        onChange={(url) => set("photoUrlMobile", url)}
      />
      <p className="-mt-sp-4 text-xs text-ink/50">
        Se usa aparte para pantallas de teléfono — puede ser un recorte o composición distinta a la
        de escritorio.
      </p>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">CTA primario — texto</span>
          <input
            required
            value={form.ctaPrimaryLabel}
            onChange={(e) => set("ctaPrimaryLabel", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">CTA primario — link</span>
          <input
            required
            value={form.ctaPrimaryHref}
            onChange={(e) => set("ctaPrimaryHref", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">CTA secundario — texto</span>
          <input
            required
            value={form.ctaSecondaryLabel}
            onChange={(e) => set("ctaSecondaryLabel", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">CTA secundario — link</span>
          <input
            required
            value={form.ctaSecondaryHref}
            onChange={(e) => set("ctaSecondaryHref", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
