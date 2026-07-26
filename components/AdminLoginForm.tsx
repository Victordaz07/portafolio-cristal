"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

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
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      onSuccess?.();
      router.push("/admin");
      router.refresh();
      return;
    }

    setStatus("error");
    setErrorMessage(copy.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{copy.correo}</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
        />
      </label>

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{copy.contrasena}</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
        />
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
        {status === "loading" ? copy.entrando : copy.entrar}
      </button>
    </form>
  );
}
