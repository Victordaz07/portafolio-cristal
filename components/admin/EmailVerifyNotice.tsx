"use client";

import { useState } from "react";
import { useT } from "@/components/admin/AdminLang";

/** Aviso para confirmar el correo de la cuenta, con botón para reenviar el enlace. */
export default function EmailVerifyNotice({ email, compact = false }: { email: string; compact?: boolean }) {
  const { t } = useT();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function resend() {
    setState("sending");
    const response = await fetch("/api/admin/account/verify-email", { method: "POST" });
    if (response.ok) return setState("sent");
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? t("No se pudo enviar", "Couldn't send it"));
    setState("error");
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-sp-3 rounded-[14px] border border-coral/30 bg-coral/5 text-sm text-ink ${compact ? "px-sp-4 py-sp-3" : "p-sp-4"}`}
    >
      <p>
        <strong>{t("Confirma tu correo.", "Confirm your email.")}</strong> {t("Te mandamos un enlace a", "We sent a link to")}{" "}
        <span className="font-mono">{email}</span>.{" "}
        {t("Así te avisamos cuando una marca te escriba y puedes recuperar tu contraseña.", "That way we can tell you when a brand writes to you, and you can recover your password.")}
        {state === "sent" && <span className="ml-1 font-semibold text-coral">{t("¡Listo! Revisa tu correo (y el spam).", "Done! Check your email (and spam).")}</span>}
        {state === "error" && <span className="ml-1 text-red-600">{error}</span>}
      </p>
      {state !== "sent" && (
        <button
          type="button"
          onClick={resend}
          disabled={state === "sending"}
          className="rounded-full border border-coral px-sp-4 py-1.5 text-xs font-semibold text-coral hover:bg-coral hover:text-white disabled:opacity-60"
        >
          {state === "sending" ? t("Enviando…", "Sending…") : t("Reenviar enlace", "Resend link")}
        </button>
      )}
    </div>
  );
}
