"use client";

import { useState } from "react";
import type { Hero } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { HERO_PHOTO_ASPECT_OPTIONS } from "@/lib/image-crop";
import BilingualTextField from "@/components/admin/BilingualTextField";
import HeroPreview from "@/components/admin/HeroPreview";
import { inputClass, labelClass, primaryButtonClass, cardClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

type HeroFormValues = Omit<
  Hero,
  | "id"
  | "creatorId"
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
  const { t, lang } = useT();
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
  // La vista previa muestra la versión en inglés si el panel está en inglés y ya la escribiste.
  const pick = (es: string, en: string) => (lang === "en" && en.trim() ? en : es);

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
      showToast("success", t("Hero actualizado", "Hero updated"));
    } else {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    }
  }

  return (
    <div className="grid gap-sp-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form onSubmit={handleSubmit} className={`${cardClass} flex flex-col gap-sp-5`}>
        <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">{t("Nombre", "Name")}</span>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">{t("Ubicación", "Location")}</span>
          <input
            required
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <BilingualTextField
        label={t("Nicho", "Niche")}
        es={form.niche}
        en={form.nicheEn}
        onEsChange={(v) => set("niche", v)}
        onEnChange={(v) => set("nicheEn", v)}
        required
      />

      <BilingualTextField
        label={t("Badge (pill arriba del título)", "Badge (pill above the title)")}
        es={form.badgeLabel}
        en={form.badgeLabelEn}
        onEsChange={(v) => set("badgeLabel", v)}
        onEnChange={(v) => set("badgeLabelEn", v)}
        required
      />

      <div className="grid gap-sp-4 sm:grid-cols-3">
        <BilingualTextField
          label={t("Título — línea 1", "Title — line 1")}
          es={form.headlinePlain}
          en={form.headlinePlainEn}
          onEsChange={(v) => set("headlinePlain", v)}
          onEnChange={(v) => set("headlinePlainEn", v)}
          required
        />
        <BilingualTextField
          label={t("Título — palabra en color", "Title — highlighted word")}
          es={form.headlineEmphasis}
          en={form.headlineEmphasisEn}
          onEsChange={(v) => set("headlineEmphasis", v)}
          onEnChange={(v) => set("headlineEmphasisEn", v)}
          required
        />
        <BilingualTextField
          label={t("Título — resto de la línea 2", "Title — rest of line 2")}
          es={form.headlineSuffix}
          en={form.headlineSuffixEn}
          onEsChange={(v) => set("headlineSuffix", v)}
          onEnChange={(v) => set("headlineSuffixEn", v)}
        />
      </div>

      <div>
        <BilingualTextField
          label={t("Descripción", "Description")}
          es={form.description}
          en={form.descriptionEn}
          onEsChange={(v) => set("description", v)}
          onEnChange={(v) => set("descriptionEn", v)}
          multiline
          rows={3}
        />
        <span className="text-xs text-ink/50">
          {t("Usa **texto** para negrita oscura y __texto__ para negrita en color de acento.", "Use **text** for dark bold and __text__ for accent-colored bold.")}
        </span>
      </div>

      <ImageUploadField
        label={t("Foto (escritorio)", "Photo (desktop)")}
        value={form.photoUrl}
        onChange={(url) => set("photoUrl", url)}
        aspect={HERO_PHOTO_ASPECT_OPTIONS}
        recommendedSize={t("1200 × 1500 px (vertical) o 1920 × 1080 px (horizontal)", "1200 × 1500 px (portrait) or 1920 × 1080 px (landscape)")}
      />

      <ImageUploadField
        label={t("Foto (mobile)", "Photo (mobile)")}
        value={form.photoUrlMobile}
        onChange={(url) => set("photoUrlMobile", url)}
        aspect={1}
        recommendedSize="1200 × 1200 px"
      />
      <p className="-mt-sp-4 text-xs text-ink/50">
        {t(
          "Se usa aparte para pantallas de teléfono — puede ser un recorte o composición distinta a la de escritorio.",
          "Used separately for phone screens — it can be a different crop or composition from the desktop one."
        )}
      </p>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <BilingualTextField
          label={t("CTA primario — texto", "Primary CTA — text")}
          es={form.ctaPrimaryLabel}
          en={form.ctaPrimaryLabelEn}
          onEsChange={(v) => set("ctaPrimaryLabel", v)}
          onEnChange={(v) => set("ctaPrimaryLabelEn", v)}
          required
        />
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">{t("CTA primario — link", "Primary CTA — link")}</span>
          <input
            required
            value={form.ctaPrimaryHref}
            onChange={(e) => set("ctaPrimaryHref", e.target.value)}
            className={inputClass}
          />
        </label>
        <BilingualTextField
          label={t("CTA secundario — texto", "Secondary CTA — text")}
          es={form.ctaSecondaryLabel}
          en={form.ctaSecondaryLabelEn}
          onEsChange={(v) => set("ctaSecondaryLabel", v)}
          onEnChange={(v) => set("ctaSecondaryLabelEn", v)}
          required
        />
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">{t("CTA secundario — link", "Secondary CTA — link")}</span>
          <input
            required
            value={form.ctaSecondaryHref}
            onChange={(e) => set("ctaSecondaryHref", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? t("Guardando…", "Saving…") : t("Guardar cambios", "Save changes")}
        </button>
      </form>

      <div className="lg:sticky lg:top-sp-6">
        <p className="mb-sp-2 font-mono text-[10px] uppercase tracking-widest text-moss">
          {t("Vista previa en vivo", "Live preview")}
        </p>
        <HeroPreview
          badgeLabel={pick(form.badgeLabel, form.badgeLabelEn)}
          headlinePlain={pick(form.headlinePlain, form.headlinePlainEn)}
          headlineEmphasis={pick(form.headlineEmphasis, form.headlineEmphasisEn)}
          headlineSuffix={pick(form.headlineSuffix, form.headlineSuffixEn)}
          description={pick(form.description, form.descriptionEn)}
          photoUrl={form.photoUrl}
          ctaPrimaryLabel={pick(form.ctaPrimaryLabel, form.ctaPrimaryLabelEn)}
          ctaSecondaryLabel={pick(form.ctaSecondaryLabel, form.ctaSecondaryLabelEn)}
        />
        <p className="mt-sp-2 text-xs text-ink/50">
          {t(
            "Aproximación del hero de escritorio — el sitio real puede variar levemente en tamaños y saltos de línea.",
            "Approximation of the desktop hero — the real site may vary slightly in sizes and line breaks."
          )}
        </p>
      </div>
    </div>
  );
}
