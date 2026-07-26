"use client";

import { useState } from "react";
import type { SiteSettings } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { inputClass, primaryButtonClass, cardClass, sectionTitleClass } from "@/lib/admin-ui";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettings | null;
}) {
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
      showToast("success", "Cambios guardados");
    } else {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo guardar");
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} max-w-xl flex flex-col gap-sp-5`}>
      <BilingualTextField
        label='Texto "Why me?"'
        es={form.whyMeText}
        en={form.whyMeTextEn}
        onEsChange={(v) => setForm((c) => ({ ...c, whyMeText: v }))}
        onEnChange={(v) => setForm((c) => ({ ...c, whyMeTextEn: v }))}
        multiline
        rows={5}
        required
      />

      <h2 className={sectionTitleClass}>
        Pie de página — &quot;Conéctate conmigo&quot;
      </h2>

      <BilingualTextField
        label="Texto de introducción"
        es={form.footerIntro}
        en={form.footerIntroEn}
        onEsChange={(v) => setForm((c) => ({ ...c, footerIntro: v }))}
        onEnChange={(v) => setForm((c) => ({ ...c, footerIntroEn: v }))}
        multiline
        rows={3}
      />

      <BilingualTextField
        label="Mensaje de agradecimiento"
        es={form.supportMessage}
        en={form.supportMessageEn}
        onEsChange={(v) => setForm((c) => ({ ...c, supportMessage: v }))}
        onEnChange={(v) => setForm((c) => ({ ...c, supportMessageEn: v }))}
        multiline
        rows={2}
      />

      <h2 className={sectionTitleClass}>¿Hablamos?</h2>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Email de contacto</span>
          <input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm((c) => ({ ...c, contactEmail: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Email de colaboraciones (opcional)</span>
          <input
            type="email"
            value={form.collabsEmail}
            onChange={(e) => setForm((c) => ({ ...c, collabsEmail: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">WhatsApp (opcional)</span>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm((c) => ({ ...c, whatsapp: e.target.value }))}
            className={inputClass}
            placeholder="+1 (809) 000-0000"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Sitio web (opcional)</span>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={(e) => setForm((c) => ({ ...c, websiteUrl: e.target.value }))}
            className={inputClass}
            placeholder="https://..."
          />
        </label>
      </div>

      <h2 className={sectionTitleClass}>Sígueme</h2>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Instagram</span>
          <input
            required
            value={form.instagramHandle}
            onChange={(e) => setForm((c) => ({ ...c, instagramHandle: e.target.value }))}
            className={inputClass}
            placeholder="@usuario"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">TikTok</span>
          <input
            required
            value={form.tiktokHandle}
            onChange={(e) => setForm((c) => ({ ...c, tiktokHandle: e.target.value }))}
            className={inputClass}
            placeholder="@usuario"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">YouTube (opcional)</span>
          <input
            value={form.youtubeHandle}
            onChange={(e) => setForm((c) => ({ ...c, youtubeHandle: e.target.value }))}
            className={inputClass}
            placeholder="/canal"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Facebook (opcional)</span>
          <input
            value={form.facebookHandle}
            onChange={(e) => setForm((c) => ({ ...c, facebookHandle: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Pinterest (opcional)</span>
          <input
            value={form.pinterestHandle}
            onChange={(e) => setForm((c) => ({ ...c, pinterestHandle: e.target.value }))}
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
