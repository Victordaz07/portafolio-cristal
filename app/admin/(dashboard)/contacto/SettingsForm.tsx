"use client";

import { useState } from "react";
import type { SiteSettings } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettings | null;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    whyMeText: initialSettings?.whyMeText ?? "",
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
    supportMessage: initialSettings?.supportMessage ?? "",
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
    <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-sp-5">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Texto &quot;Why me?&quot;</span>
        <textarea
          required
          rows={5}
          value={form.whyMeText}
          onChange={(e) => setForm((c) => ({ ...c, whyMeText: e.target.value }))}
          className={inputClass}
        />
      </label>

      <h2 className="font-bodoni italic font-bold uppercase text-lg text-ink -mb-sp-2">
        Pie de página — &quot;Conéctate conmigo&quot;
      </h2>

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Texto de introducción</span>
        <textarea
          rows={3}
          value={form.footerIntro}
          onChange={(e) => setForm((c) => ({ ...c, footerIntro: e.target.value }))}
          className={inputClass}
          placeholder="Gracias por ser parte de este espacio..."
        />
      </label>

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Mensaje de agradecimiento</span>
        <textarea
          rows={2}
          value={form.supportMessage}
          onChange={(e) => setForm((c) => ({ ...c, supportMessage: e.target.value }))}
          className={inputClass}
          placeholder="Cada like, comentario y compartida me ayuda a seguir creando contenido que te sirve."
        />
      </label>

      <h2 className="font-bodoni italic font-bold uppercase text-lg text-ink -mb-sp-2">
        ¿Hablamos?
      </h2>

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

      <h2 className="font-bodoni italic font-bold uppercase text-lg text-ink -mb-sp-2">Sígueme</h2>

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
