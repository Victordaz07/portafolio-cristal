"use client";

import { useState } from "react";

/** Aviso para confirmar el correo de la cuenta, con botón para reenviar el enlace. */
export default function EmailVerifyNotice({ email, compact = false }: { email: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function resend() {
    setState("sending");
    const response = await fetch("/api/admin/account/verify-email", { method: "POST" });
    if (response.ok) return setState("sent");
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? "No se pudo enviar");
    setState("error");
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-sp-3 rounded-[14px] border border-coral/30 bg-coral/5 text-sm text-ink ${compact ? "px-sp-4 py-sp-3" : "p-sp-4"}`}
    >
      <p>
        <strong>Confirma tu correo.</strong> Te mandamos un enlace a <span className="font-mono">{email}</span>. Así te avisamos
        cuando una marca te escriba y puedes recuperar tu contraseña.
        {state === "sent" && <span className="ml-1 font-semibold text-coral">¡Listo! Revisa tu correo (y el spam).</span>}
        {state === "error" && <span className="ml-1 text-red-600">{error}</span>}
      </p>
      {state !== "sent" && (
        <button
          type="button"
          onClick={resend}
          disabled={state === "sending"}
          className="rounded-full border border-coral px-sp-4 py-1.5 text-xs font-semibold text-coral hover:bg-coral hover:text-white disabled:opacity-60"
        >
          {state === "sending" ? "Enviando…" : "Reenviar enlace"}
        </button>
      )}
    </div>
  );
}
