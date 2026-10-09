"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass = "rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral";

/** Login de una creadora de una agencia (plan Crew) con su código de acceso — sin contraseña. */
export default function AgencyClientLoginForm({ agencySlug }: { agencySlug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const response = await fetch("/api/admin/login/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, agencySlug }),
    });

    if (response.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setStatus("error");
    setErrorMessage(body.error || "No se pudo entrar. Revisa tu correo y tu código.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Tu correo</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Tu código de acceso</span>
        <input
          required
          autoFocus
          inputMode="text"
          spellCheck={false}
          placeholder="XXXX-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`${inputClass} font-mono tracking-widest`}
        />
        <span className="text-xs text-ink/50">Te lo dio tu agencia. Si lo perdiste, pídeles uno nuevo.</span>
      </label>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-sp-2 rounded-sm bg-coral text-white font-medium py-sp-3 hover:opacity-90 disabled:opacity-60 transition"
      >
        {status === "loading" ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
