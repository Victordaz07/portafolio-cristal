"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

const inputClass = "rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral";

export default function AdminLoginForm({
  onSuccess,
  locale = "es",
}: {
  onSuccess?: () => void;
  locale?: Locale;
}) {
  const copy = t(locale).adminLogin;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /** Segundo paso: aparece cuando la contraseña es correcta y la cuenta tiene verificación en dos pasos. */
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...(needsCode && code.trim() ? { code: code.trim() } : {}) }),
    });

    if (response.ok) {
      onSuccess?.();
      router.push("/admin");
      router.refresh();
      return;
    }

    const body = (await response.json().catch(() => ({}))) as { paused?: boolean; twoFactor?: boolean; locked?: boolean; error?: string };
    if (body.twoFactor && !needsCode) {
      // Contraseña correcta: ahora se pide el código, sin mostrarlo como error.
      setNeedsCode(true);
      setStatus("idle");
      return;
    }
    setStatus("error");
    // El servidor ya manda estos mensajes en el idioma del panel; el resto usa el genérico.
    setErrorMessage((body.paused || body.twoFactor || body.locked || response.status === 429) && body.error ? body.error : copy.error);
  }

  function useAnotherAccount() {
    setNeedsCode(false);
    setCode("");
    setPassword("");
    setStatus("idle");
    setErrorMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      {needsCode ? (
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{copy.codigo}</span>
          <input
            required
            autoFocus
            inputMode="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputClass} font-mono tracking-widest`}
          />
          <span className="text-xs text-ink/50">{copy.codigoAyuda}</span>
        </label>
      ) : (
        <>
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">{copy.correo}</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>

          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">{copy.contrasena}</span>
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </label>
        </>
      )}

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
        {status === "loading" ? copy.entrando : needsCode ? copy.verificar : copy.entrar}
      </button>
      {needsCode && (
        <button type="button" onClick={useAnotherAccount} className="self-center text-sm text-ink/60 hover:text-coral hover:underline">
          {copy.volver}
        </button>
      )}
    </form>
  );
}
