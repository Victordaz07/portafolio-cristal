"use client";

import { useState } from "react";
import type { SiteSettings } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { inputClass, primaryButtonClass, cardClass, sectionTitleClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettings | null;
}) {
  const { t } = useT();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    whyMeText: initialSettings?.whyMeText ?? "",
    whyMeTextEn: initialSettings?.whyMeTextEn ?? "",
    contactEmail: initialSettings?.contactEmail ?? "",
    instagramHandle: initialSettings?.instagramHandle ?? "",
    tiktokHandle: initialSettings?.tiktokHandle ?? "",
    facebookHandle: initialSettings?.facebookHandle ?? "",
    whatsapp: initialSettings?.whatsapp ?? "",
    collabsEmail: initialSettings?.collabsEmail ?? "",
    websiteUrl: initialSettings?.websiteUrl ?? "",
    youtubeHandle: initialSettings?.youtubeHandle ?? "",
    pinterestHandle: initialSettings?.pinterestHandle ?? "",
    footerIntro: initialSettings?.footerIntro ?? "",
    footerIntroEn: initialSettings?.footerIntroEn ?? "",
    supportMessage: initialSettings?.supportMessage ?? "",
    supportMessageEn: initialSettings?.supportMessageEn ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (response.ok) {
      showToast("success", t("Cambios guardados", "Changes saved"));
    } else {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} max-w-xl flex flex-col gap-sp-5`}>
      <BilingualTextField
        label={t('Texto "¿Por qué yo?"', 'Text "Why me?"')}
        es={form.whyMeText}
        en={form.whyMeTextEn}
        onEsChange={(v) => setForm((c) => ({ ...c, whyMeText: v }))}
        onEnChange={(v) => setForm((c) => ({ ...c, whyMeTextEn: v }))}
        multiline
        rows={5}
        required
      />

      <h2 className={sectionTitleClass}>
        {t("Pie de página — \"Conéctate conmigo\"", "Footer — \"Connect with me\"")}
      </h2>

      <BilingualTextField
        label={t("Texto de introducción", "Intro text")}
        es={form.footerIntro}
        en={form.footerIntroEn}
        onEsChange={(v) => setForm((c) => ({ ...c, footerIntro: v }))}
        onEnChange={(v) => setForm((c) => ({ ...c, footerIntroEn: v }))}
        multiline
        rows={3}
      />

      <BilingualTextField
        label={t("Mensaje de agradecimiento", "Thank-you message")}
        es={form.supportMessage}
        en={form.supportMessageEn}
        onEsChange={(v) => setForm((c) => ({ ...c, supportMessage: v }))}
        onEnChange={(v) => setForm((c) => ({ ...c, supportMessageEn: v }))}
        multiline
        rows={2}
      />

      <h2 className={sectionTitleClass}>{t("¿Hablamos?", "Let's talk?")}</h2>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Email de contacto", "Contact email")}</span>
          <input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm((c) => ({ ...c, contactEmail: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Email de colaboraciones (opcional)", "Collaborations email (optional)")}</span>
          <input
            type="email"
            value={form.collabsEmail}
            onChange={(e) => setForm((c) => ({ ...c, collabsEmail: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("WhatsApp (opcional)", "WhatsApp (optional)")}</span>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm((c) => ({ ...c, whatsapp: e.target.value }))}
            className={inputClass}
            placeholder="+1 (809) 000-0000"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Sitio web (opcional)", "Website (optional)")}</span>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={(e) => setForm((c) => ({ ...c, websiteUrl: e.target.value }))}
            className={inputClass}
            placeholder="https://..."
          />
        </label>
      </div>

      <h2 className={sectionTitleClass}>{t("Sígueme", "Follow me")}</h2>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Instagram</span>
          <input
            required
            value={form.instagramHandle}
            onChange={(e) => setForm((c) => ({ ...c, instagramHandle: e.target.value }))}
            className={inputClass}
            placeholder={t("@usuario", "@username")}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">TikTok</span>
          <input
            required
            value={form.tiktokHandle}
            onChange={(e) => setForm((c) => ({ ...c, tiktokHandle: e.target.value }))}
            className={inputClass}
            placeholder={t("@usuario", "@username")}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("YouTube (opcional)", "YouTube (optional)")}</span>
          <input
            value={form.youtubeHandle}
            onChange={(e) => setForm((c) => ({ ...c, youtubeHandle: e.target.value }))}
            className={inputClass}
            placeholder={t("/canal", "/channel")}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Facebook (opcional)", "Facebook (optional)")}</span>
          <input
            value={form.facebookHandle}
            onChange={(e) => setForm((c) => ({ ...c, facebookHandle: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Pinterest (opcional)", "Pinterest (optional)")}</span>
          <input
            value={form.pinterestHandle}
            onChange={(e) => setForm((c) => ({ ...c, pinterestHandle: e.target.value }))}
            className={inputClass}
          />
        </label>
      </div>

      <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
        {saving ? t("Guardando...", "Saving...") : t("Guardar cambios", "Save changes")}
      </button>
    </form>
  );
}
