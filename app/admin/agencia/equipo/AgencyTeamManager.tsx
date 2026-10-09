"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, dangerLinkClass } from "@/lib/admin-ui";

type Member = { id: string; email: string; name: string | null; role: "owner" | "cm" };

export default function AgencyTeamManager({ members, selfId }: { members: Member[]; selfId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "cm">("cm");
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      showToast("error", data.error ?? "No se pudo guardar");
      return false;
    }
    router.refresh();
    return true;
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (await call("/api/admin/agency/equipo", "POST", { email, role })) {
      showToast("success", "Persona agregada a tu agencia");
      setEmail("");
    }
  }

  return (
    <>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Sumar a alguien</p>
        <form onSubmit={add} className="flex flex-col gap-sp-3 md:flex-row md:items-end">
          <label className={`${labelClass} flex-1`}>
            <span className="text-sm font-semibold text-ink">Correo de su cuenta de Foliocrew</span>
            <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@correo.com" />
          </label>
          <label className={labelClass}>
            <span className="text-sm font-semibold text-ink">Rol</span>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as "owner" | "cm")}>
              <option value="cm">Community manager</option>
              <option value="owner">Dueño</option>
            </select>
          </label>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            Agregar
          </button>
        </form>
        <p className="mt-sp-2 text-xs text-ink/60">Tiene que tener ya una cuenta de Foliocrew (puede crear una gratis) con ese mismo correo.</p>
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tu equipo ({members.length})</p>
        <ul className="flex flex-col gap-sp-3">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-sp-2 border-t border-line pt-sp-3 first:border-0 first:pt-0">
              <div>
                <span className="font-semibold text-ink">{m.name || m.email}</span>{" "}
                <span className="rounded-full bg-ink/5 px-[8px] py-px font-mono text-[10px] uppercase text-ink/70">{m.role === "owner" ? "Dueño" : "Community manager"}</span>
              </div>
              {m.id !== selfId && (
                <div className="flex gap-sp-3">
                  <button
                    type="button"
                    className="text-sm text-ink/60 hover:text-coral"
                    disabled={busy}
                    onClick={() => call(`/api/admin/agency/equipo/${m.id}`, "PATCH", { role: m.role === "owner" ? "cm" : "owner" })}
                  >
                    Hacer {m.role === "owner" ? "community manager" : "dueño"}
                  </button>
                  <button type="button" className={dangerLinkClass} disabled={busy} onClick={() => call(`/api/admin/agency/equipo/${m.id}`, "DELETE")}>
                    Quitar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
