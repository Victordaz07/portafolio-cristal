"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";

export default function AccountForm({
  initialName,
  email,
  isPlatformAdmin = false,
  impersonating = false,
}: {
  initialName: string;
  email: string;
  isPlatformAdmin?: boolean;
  impersonating?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState<"name" | "password" | "email" | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [loseAdminOk, setLoseAdminOk] = useState(false);

  async function changeEmail() {
    setSaving("email");
    const response = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, currentPassword: emailPassword, confirmLoseAdmin: loseAdminOk }),
    });
    setSaving(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? "No se pudo cambiar el correo");
    setNewEmail("");
    setEmailPassword("");
    showToast("success", `Listo: ahora entras con ${data.email}. Te mandamos un enlace para confirmarlo.`);
    router.refresh();
  }

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
      <Card className="lg:col-span-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            changeEmail();
          }}
          className="flex flex-col gap-sp-4"
        >
          <div>
            <p className="text-sm font-medium text-ink">Correo para entrar</p>
            <p className="mt-1 text-xs text-ink/55">
              Ahora: <span className="font-mono">{email}</span>. Al cambiarlo, entras con el nuevo, te mandamos un enlace para
              confirmarlo y le avisamos al anterior.
            </p>
          </div>
          {impersonating ? (
            <p className="text-sm text-ink/60">
              Desde &quot;Entrar como&quot; no se cambia el correo. Hazlo desde la ficha de la cuenta en el panel de dueño.
            </p>
          ) : (
            <>
              <div className="grid gap-sp-4 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className="text-sm font-medium text-ink">Correo nuevo</span>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span className="text-sm font-medium text-ink">Tu contraseña actual</span>
                  <input type="password" required value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} autoComplete="current-password" className={inputClass} />
                </label>
              </div>
              {isPlatformAdmin && (
                <label className="flex items-start gap-sp-2 rounded-[12px] border border-amber-300 bg-amber-50 p-sp-3 text-sm text-ink">
                  <input type="checkbox" checked={loseAdminOk} onChange={(e) => setLoseAdminOk(e.target.checked)} className="mt-1" />
                  <span>
                    Este es el correo de <strong>administración de Foliocrew</strong>. Si lo cambias, esta cuenta deja de ver el panel de
                    dueño. Para seguir administrando, después crea tu propia cuenta con este correo: el panel de dueño sigue
                    al correo, no a la cuenta. Entiendo.
                  </span>
                </label>
              )}
              <button
                type="submit"
                disabled={saving === "email" || (isPlatformAdmin && !loseAdminOk)}
                className={`${primaryButtonClass} self-start`}
              >
                {saving === "email" ? "Cambiando…" : "Cambiar correo"}
              </button>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
