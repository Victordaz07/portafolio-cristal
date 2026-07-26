"use client";

import { useState } from "react";
import type { Hero } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ImageUploadField from "@/components/admin/ImageUploadField";
import BilingualTextField from "@/components/admin/BilingualTextField";
import HeroPreview from "@/components/admin/HeroPreview";
import { inputClass, labelClass, primaryButtonClass, cardClass } from "@/lib/admin-ui";

type HeroFormValues = Omit<
  Hero,
  | "id"
  | "updatedAt"
  | "photoUrl"
  | "photoUrlMobile"
  | "nicheEn"
  | "badgeLabelEn"
  | "headlinePlainEn"
  | "headlineEmphasisEn"
  | "headlineSuffixEn"
  | "descriptionEn"
  | "ctaPrimaryLabelEn"
  | "ctaSecondaryLabelEn"
> & {
  photoUrl: string;
  photoUrlMobile: string;
  nicheEn: string;
  badgeLabelEn: string;
  headlinePlainEn: string;
  headlineEmphasisEn: string;
  headlineSuffixEn: string;
  descriptionEn: string;
  ctaPrimaryLabelEn: string;
  ctaSecondaryLabelEn: string;
};

const EMPTY: HeroFormValues = {
  name: "",
  location: "",
  niche: "",
  nicheEn: "",
  badgeLabel: "",
  badgeLabelEn: "",
  headlinePlain: "",
  headlinePlainEn: "",
  headlineEmphasis: "",
  headlineEmphasisEn: "",
  headlineSuffix: "",
  headlineSuffixEn: "",
  description: "",
  descriptionEn: "",
  photoUrl: "",
  photoUrlMobile: "",
  ctaPrimaryLabel: "",
  ctaPrimaryLabelEn: "",
  ctaPrimaryHref: "",
  ctaSecondaryLabel: "",
  ctaSecondaryLabelEn: "",
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
          nicheEn: initialHero.nicheEn ?? "",
          badgeLabel: initialHero.badgeLabel,
          badgeLabelEn: initialHero.badgeLabelEn ?? "",
          headlinePlain: initialHero.headlinePlain,
          headlinePlainEn: initialHero.headlinePlainEn ?? "",
          headlineEmphasis: initialHero.headlineEmphasis,
          headlineEmphasisEn: initialHero.headlineEmphasisEn ?? "",
          headlineSuffix: initialHero.headlineSuffix,
          headlineSuffixEn: initialHero.headlineSuffixEn ?? "",
          description: initialHero.description,
          descriptionEn: initialHero.descriptionEn ?? "",
          photoUrl: initialHero.photoUrl ?? "",
          photoUrlMobile: initialHero.photoUrlMobile ?? "",
          ctaPrimaryLabel: initialHero.ctaPrimaryLabel,
          ctaPrimaryLabelEn: initialHero.ctaPrimaryLabelEn ?? "",
          ctaPrimaryHref: initialHero.ctaPrimaryHref,
          ctaSecondaryLabel: initialHero.ctaSecondaryLabel,
          ctaSecondaryLabelEn: initialHero.ctaSecondaryLabelEn ?? "",
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
    <div className="grid gap-sp-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form onSubmit={handleSubmit} className={`${cardClass} flex flex-col gap-sp-5`}>
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

      <BilingualTextField
        label="Nicho"
        es={form.niche}
        en={form.nicheEn}
        onEsChange={(v) => set("niche", v)}
        onEnChange={(v) => set("nicheEn", v)}
        required
      />

      <BilingualTextField
        label="Badge (pill arriba del título)"
        es={form.badgeLabel}
        en={form.badgeLabelEn}
        onEsChange={(v) => set("badgeLabel", v)}
        onEnChange={(v) => set("badgeLabelEn", v)}
        required
      />

      <div className="grid gap-sp-4 sm:grid-cols-3">
        <BilingualTextField
          label="Título — línea 1"
          es={form.headlinePlain}
          en={form.headlinePlainEn}
          onEsChange={(v) => set("headlinePlain", v)}
          onEnChange={(v) => set("headlinePlainEn", v)}
          required
        />
        <BilingualTextField
          label="Título — palabra en color"
          es={form.headlineEmphasis}
          en={form.headlineEmphasisEn}
          onEsChange={(v) => set("headlineEmphasis", v)}
          onEnChange={(v) => set("headlineEmphasisEn", v)}
          required
        />
        <BilingualTextField
          label="Título — resto de la línea 2"
          es={form.headlineSuffix}
          en={form.headlineSuffixEn}
          onEsChange={(v) => set("headlineSuffix", v)}
          onEnChange={(v) => set("headlineSuffixEn", v)}
        />
      </div>

      <div>
        <BilingualTextField
          label="Descripción"
          es={form.description}
          en={form.descriptionEn}
          onEsChange={(v) => set("description", v)}
          onEnChange={(v) => set("descriptionEn", v)}
          multiline
          rows={3}
        />
        <span className="text-xs text-ink/50">
          Usa **texto** para negrita oscura y __texto__ para negrita en color de acento.
        </span>
      </div>

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
        <BilingualTextField
          label="CTA primario — texto"
          es={form.ctaPrimaryLabel}
          en={form.ctaPrimaryLabelEn}
          onEsChange={(v) => set("ctaPrimaryLabel", v)}
          onEnChange={(v) => set("ctaPrimaryLabelEn", v)}
          required
        />
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">CTA primario — link</span>
          <input
            required
            value={form.ctaPrimaryHref}
            onChange={(e) => set("ctaPrimaryHref", e.target.value)}
            className={inputClass}
          />
        </label>
        <BilingualTextField
          label="CTA secundario — texto"
          es={form.ctaSecondaryLabel}
          en={form.ctaSecondaryLabelEn}
          onEsChange={(v) => set("ctaSecondaryLabel", v)}
          onEnChange={(v) => set("ctaSecondaryLabelEn", v)}
          required
        />
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

      <div className="lg:sticky lg:top-sp-6">
        <p className="mb-sp-2 font-mono text-[10px] uppercase tracking-widest text-moss">
          Vista previa en vivo
        </p>
        <HeroPreview
          badgeLabel={form.badgeLabel}
          headlinePlain={form.headlinePlain}
          headlineEmphasis={form.headlineEmphasis}
          headlineSuffix={form.headlineSuffix}
          description={form.description}
          photoUrl={form.photoUrl}
          ctaPrimaryLabel={form.ctaPrimaryLabel}
          ctaSecondaryLabel={form.ctaSecondaryLabel}
        />
        <p className="mt-sp-2 text-xs text-ink/50">
          Aproximación del hero de escritorio — el sitio real puede variar levemente en tamaños y
          saltos de línea.
        </p>
      </div>
    </div>
  );
}
