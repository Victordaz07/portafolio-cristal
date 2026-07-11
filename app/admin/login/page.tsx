"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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
      router.push("/admin");
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => ({}));
    setStatus("error");
    setErrorMessage(data.error ?? "No se pudo iniciar sesión");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
          Panel privado
        </p>
        <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-6">
          Crislia — Admin
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Correo</span>
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
            <span className="text-sm font-medium text-ink">Contraseña</span>
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
            {status === "loading" ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
