"use client";

import { useState } from "react";
import { useT } from "@/components/admin/AdminLang";

const inputClass = "rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral";

export default function ForgotPasswordForm() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    const response = await fetch("/api/admin/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.ok) return setStatus("sent");
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? t("No se pudo enviar; intenta de nuevo", "Couldn't send it; try again"));
    setStatus("error");
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-sm bg-cream p-sp-4 text-sm text-ink">
        <p className="font-semibold">{t("Revisa tu correo 💌", "Check your email 💌")}</p>
        <p className="mt-sp-1 text-ink/70">
          {t("Si", "If")} <strong>{email}</strong>{" "}
          {t("tiene una cuenta en Foliocrew, te llegará un enlace en unos minutos. Vence en 1 hora. Revisa también la carpeta de spam.", "has a Foliocrew account, you'll get a link in a few minutes. It expires in 1 hour. Check your spam folder too.")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Correo", "Email")}</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-sp-2 rounded-sm bg-coral text-white font-medium py-sp-3 hover:opacity-90 disabled:opacity-60 transition"
      >
        {status === "loading" ? t("Enviando…", "Sending…") : t("Mandarme el enlace", "Send me the link")}
      </button>
    </form>
  );
}
