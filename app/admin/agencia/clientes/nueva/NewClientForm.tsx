"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 30);
}

export default function NewClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ accessCode: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/agency/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || slugify(name), email }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "No se pudo crear la cuenta");
      return;
    }
    setResult(body);
  }

  if (result) {
    return (
      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Cuenta creada</p>
        <p className="mt-sp-2 text-sm text-ink/70">Este es su código de acceso. Guárdalo — no se vuelve a mostrar completo, pero puedes generar uno nuevo desde su ficha.</p>
        <p className="mt-sp-3 r-sm border border-line bg-cream px-sp-4 py-sp-3 text-center font-mono text-lg tracking-widest text-ink">{result.accessCode}</p>
        <button type="button" onClick={() => router.push("/admin/agencia/clientes")} className={`${primaryButtonClass} mt-sp-4`}>
          Volver a la cartera
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Nombre</span>
          <input className={inputClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cristal Flores" />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Dirección (tunombre.foliocrew.pro)</span>
          <input className={inputClass} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder={slugify(name) || "tunombre"} />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Su correo</span>
          <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@correo.com" />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
    </Card>
  );
}
