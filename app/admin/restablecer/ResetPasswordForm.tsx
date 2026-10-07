"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/admin/AdminLang";

const inputClass = "rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral";

export default function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useT();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError(t("La contraseña debe tener al menos 8 caracteres", "Password must be at least 8 characters"));
    if (password !== confirm) return setError(t("Las contraseñas no coinciden", "Passwords don't match"));
    setError("");
    setLoading(true);
    const response = await fetch("/api/admin/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (response.ok) {
      const body = (await response.json().catch(() => ({}))) as { twoFactor?: boolean };
      // Con verificación en dos pasos no se entra directo: falta el código de la app.
      router.push(body.twoFactor ? "/admin/login?contrasena=nueva" : "/admin?contrasena=nueva");
      router.refresh();
      return;
    }
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? t("No se pudo guardar; intenta de nuevo", "Couldn't save; try again"));
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Contraseña nueva", "New password")}</span>
        <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        <span className="text-xs text-ink/50">{t("Mínimo 8 caracteres.", "At least 8 characters.")}</span>
      </label>
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Repite la contraseña", "Repeat the password")}</span>
        <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-sp-2 rounded-sm bg-coral text-white font-medium py-sp-3 hover:opacity-90 disabled:opacity-60 transition"
      >
        {loading ? t("Guardando…", "Saving…") : t("Guardar y entrar", "Save and sign in")}
      </button>
    </form>
  );
}
