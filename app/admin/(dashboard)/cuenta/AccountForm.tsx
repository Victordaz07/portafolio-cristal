"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";

export default function AccountForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState<"name" | "password" | null>(null);

  async function save(body: object, kind: "name" | "password") {
    setSaving(kind);
    const response = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? "No se pudo guardar");
    if (kind === "password") {
      setCurrentPassword("");
      setNewPassword("");
      showToast("success", "Contraseña actualizada");
    } else {
      showToast("success", "Nombre actualizado");
      router.refresh();
    }
  }

  return (
    <div className="grid gap-sp-4 lg:grid-cols-2">
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ name }, "name");
          }}
          className="flex flex-col gap-sp-4"
        >
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">Nombre</span>
            <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">Correo</span>
            <input value={email} disabled className={`${inputClass} bg-cream text-ink/60`} />
          </label>
          <button type="submit" disabled={saving === "name"} className={`${primaryButtonClass} self-start`}>
            {saving === "name" ? "Guardando…" : "Guardar nombre"}
          </button>
        </form>
      </Card>
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ currentPassword, newPassword }, "password");
          }}
          className="flex flex-col gap-sp-4"
        >
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">Contraseña actual</span>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">Contraseña nueva</span>
            <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
          </label>
          <button type="submit" disabled={saving === "password"} className={`${primaryButtonClass} self-start`}>
            {saving === "password" ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      </Card>
    </div>
  );
}
