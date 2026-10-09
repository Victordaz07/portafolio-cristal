"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

export default function ClientActions({ creatorId }: { creatorId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"enter" | "code" | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);

  async function enter() {
    setBusy("enter");
    setError("");
    const response = await fetch("/api/admin/agency/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setBusy(null);
      setError(body.error || "No se pudo entrar");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function generateCode() {
    setBusy("code");
    setError("");
    const response = await fetch(`/api/admin/agency/clientes/${creatorId}/code`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) {
      setError(body.error || "No se pudo generar el código");
      return;
    }
    setCode(body.accessCode);
  }

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex flex-wrap gap-sp-3">
        <button type="button" onClick={enter} disabled={busy !== null} className={primaryButtonClass}>
          {busy === "enter" ? "Entrando…" : "Entrar a esta cuenta"}
        </button>
        <button type="button" onClick={generateCode} disabled={busy !== null} className={secondaryButtonClass}>
          {busy === "code" ? "Generando…" : "Generar código de acceso"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {code && (
        <div>
          <p className="text-sm text-ink/60">Nuevo código (guárdalo — el anterior dejó de servir):</p>
          <p className="mt-sp-1 r-sm border border-line bg-cream px-sp-4 py-sp-3 text-center font-mono text-lg tracking-widest text-ink">{code}</p>
        </div>
      )}
    </div>
  );
}
