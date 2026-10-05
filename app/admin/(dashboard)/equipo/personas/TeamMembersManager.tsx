"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, dangerLinkClass } from "@/lib/admin-ui";
import { TEAM_ROLES } from "@/lib/team-roles";

type Member = { id: string; email: string; name: string | null; roles: string[]; active: boolean; account: string | null };

function RoleChecks({ value, onChange, disabled }: { value: string[]; onChange: (roles: string[]) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-sp-2">
      {TEAM_ROLES.map((role) => {
        const on = value.includes(role.id);
        return (
          <label
            key={role.id}
            title={role.hint}
            className={`flex cursor-pointer items-center gap-sp-1.5 rounded-full border px-sp-3 py-1.5 text-xs font-semibold transition ${
              on ? "border-coral bg-coral/10 text-coral" : "border-line text-ink/70 hover:border-coral/40"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={on}
              disabled={disabled}
              onChange={() => onChange(on ? value.filter((r) => r !== role.id) : [...value, role.id])}
            />
            {on ? "✓ " : ""}
            {role.label}
          </label>
        );
      })}
    </div>
  );
}

export default function TeamMembersManager({ owners, members }: { owners: { email: string; account: string | null }[]; members: Member[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<string[]>(["support"]);
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
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
    if (await call("/api/admin/team/members", "POST", { email, name: name || undefined, roles })) {
      showToast("success", "Persona agregada al equipo");
      setEmail("");
      setName("");
    }
  }

  return (
    <>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Sumar a alguien</p>
        <form onSubmit={add} className="flex flex-col gap-sp-3">
          <div className="grid gap-sp-3 md:grid-cols-2">
            <label className={labelClass}>
              <span className="text-sm font-semibold text-ink">Correo de su cuenta de Foliocrew</span>
              <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@correo.com" />
            </label>
            <label className={labelClass}>
              <span className="text-sm font-semibold text-ink">Nombre (opcional)</span>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cristal" />
            </label>
          </div>
          <div className="flex flex-col gap-sp-1.5">
            <span className="text-sm font-semibold text-ink">Roles</span>
            <RoleChecks value={roles} onChange={setRoles} />
            <ul className="mt-sp-1 list-disc pl-sp-4 text-xs text-ink/60">
              {TEAM_ROLES.map((r) => (
                <li key={r.id}>
                  <strong>{r.label}:</strong> {r.hint}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <button type="submit" className={primaryButtonClass} disabled={busy || !roles.length}>
              Agregar al equipo
            </button>
          </div>
          <p className="text-xs text-ink/60">
            Si la persona todavía no tiene cuenta, el acceso se activa en cuanto cree su cuenta de Foliocrew con ese mismo correo.
          </p>
        </form>
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Dueño</p>
        <ul className="flex flex-col gap-sp-2 text-sm">
          {owners.map((o) => (
            <li key={o.email} className="flex flex-wrap items-center gap-sp-2">
              <span className="font-semibold text-ink">{o.email}</span>
              <span className="rounded-full bg-ink px-[8px] py-px font-mono text-[10px] uppercase text-cream">Dueño · todos los roles</span>
              <span className="text-xs text-ink/50">{o.account ? `Cuenta: ${o.account}` : "Sin cuenta todavía"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-sp-2 text-xs text-ink/50">El Dueño se define en Vercel con PLATFORM_ADMIN_EMAILS.</p>
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Equipo ({members.length})</p>
        {members.length === 0 && <p className="text-sm text-ink/60">Todavía no agregaste a nadie.</p>}
        <ul className="flex flex-col gap-sp-4">
          {members.map((m) => (
            <li key={m.id} className={`flex flex-col gap-sp-2 border-t border-line pt-sp-4 first:border-0 first:pt-0 ${m.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-sp-2">
                <span className="font-semibold text-ink">{m.name || m.email}</span>
                {m.name && <span className="text-sm text-ink/60">{m.email}</span>}
                <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${m.account ? "bg-sage/30 text-cobalt-ink" : "bg-lime/40 text-ink"}`}>
                  {m.account ? `Cuenta: ${m.account}` : "Sin cuenta todavía"}
                </span>
                {!m.active && <span className="rounded-full bg-red-50 px-[8px] py-px font-mono text-[10px] uppercase text-red-700">Acceso pausado</span>}
              </div>
              <RoleChecks
                value={m.roles}
                disabled={busy}
                onChange={(next) => next.length && call(`/api/admin/team/members/${m.id}`, "PATCH", { roles: next }).then((ok) => ok && showToast("success", "Roles actualizados"))}
              />
              <div className="flex flex-wrap gap-sp-3">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={busy}
                  onClick={() => call(`/api/admin/team/members/${m.id}`, "PATCH", { active: !m.active }).then((ok) => ok && showToast("success", m.active ? "Acceso pausado" : "Acceso reactivado"))}
                >
                  {m.active ? "Pausar acceso" : "Reactivar acceso"}
                </button>
                <button
                  type="button"
                  className={dangerLinkClass}
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`¿Quitar a ${m.name || m.email} del equipo? Su cuenta de Foliocrew sigue igual.`)) {
                      call(`/api/admin/team/members/${m.id}`, "DELETE").then((ok) => ok && showToast("success", "Persona quitada del equipo"));
                    }
                  }}
                >
                  Quitar del equipo
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
