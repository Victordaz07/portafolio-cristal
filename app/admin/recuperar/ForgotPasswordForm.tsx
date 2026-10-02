"use client";

import { useState } from "react";

const inputClass = "rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral";

export default function ForgotPasswordForm() {
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
    setError(body.error ?? "No se pudo enviar; intenta de nuevo");
    setStatus("error");
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-sm bg-cream p-sp-4 text-sm text-ink">
        <p className="font-semibold">Revisa tu correo 💌</p>
        <p className="mt-sp-1 text-ink/70">
          Si <strong>{email}</strong> tiene una cuenta en Foliocrew, te llegará un enlace en unos minutos. Vence en 1 hora.
          Revisa también la carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Correo</span>
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
        {status === "loading" ? "Enviando…" : "Mandarme el enlace"}
      </button>
    </form>
  );
}
