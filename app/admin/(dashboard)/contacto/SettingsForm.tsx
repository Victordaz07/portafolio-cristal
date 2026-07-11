"use client";

import { useState } from "react";
import type { SiteSettingsModel as SiteSettings } from "@/lib/generated/prisma/models";
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
      </div>

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Facebook (opcional)</span>
        <input
          value={form.facebookHandle}
          onChange={(e) => setForm((c) => ({ ...c, facebookHandle: e.target.value }))}
          className={inputClass}
        />
      </label>

      <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
