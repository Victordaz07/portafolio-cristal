"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, dangerLinkClass } from "@/lib/admin-ui";
import { TEAM_ROLES } from "@/lib/team-roles";
import { useT } from "@/components/admin/AdminLang";

type Member = { id: string; email: string; name: string | null; roles: string[]; active: boolean; account: string | null };

function RoleChecks({ value, onChange, disabled }: { value: string[]; onChange: (roles: string[]) => void; disabled?: boolean }) {
  const { lang } = useT();
  return (
    <div className="flex flex-wrap gap-sp-2">
      {TEAM_ROLES.map((role) => {
        const on = value.includes(role.id);
        return (
          <label
            key={role.id}
            title={lang === "en" ? role.hintEn : role.hint}
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
            {lang === "en" ? role.labelEn : role.label}
          </label>
        );
      })}
    </div>
  );
}

export default function TeamMembersManager({ owners, members }: { owners: { email: string; account: string | null }[]; members: Member[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t, lang } = useT();
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
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return false;
    }
    router.refresh();
    return true;
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (await call("/api/admin/team/members", "POST", { email, name: name || undefined, roles })) {
      showToast("success", t("Persona agregada al equipo", "Person added to the team"));
      setEmail("");
      setName("");
    }
  }

  return (
    <>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Sumar a alguien", "Add someone")}</p>
        <form onSubmit={add} className="flex flex-col gap-sp-3">
          <div className="grid gap-sp-3 md:grid-cols-2">
            <label className={labelClass}>
              <span className="text-sm font-semibold text-ink">{t("Correo de su cuenta de Foliocrew", "Their Foliocrew account email")}</span>
              <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("persona@correo.com", "person@email.com")} />
            </label>
            <label className={labelClass}>
              <span className="text-sm font-semibold text-ink">{t("Nombre (opcional)", "Name (optional)")}</span>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cristal" />
            </label>
          </div>
          <div className="flex flex-col gap-sp-1.5">
            <span className="text-sm font-semibold text-ink">Roles</span>
            <RoleChecks value={roles} onChange={setRoles} />
            <ul className="mt-sp-1 list-disc pl-sp-4 text-xs text-ink/60">
              {TEAM_ROLES.map((r) => (
                <li key={r.id}>
                  <strong>{lang === "en" ? r.labelEn : r.label}:</strong> {lang === "en" ? r.hintEn : r.hint}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <button type="submit" className={primaryButtonClass} disabled={busy || !roles.length}>
              {t("Agregar al equipo", "Add to team")}
            </button>
          </div>
          <p className="text-xs text-ink/60">
            {t("Si la persona todavía no tiene cuenta, el acceso se activa en cuanto cree su cuenta de Foliocrew con ese mismo correo.", "If the person doesn't have an account yet, access turns on as soon as they create their Foliocrew account with that same email.")}
          </p>
        </form>
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Dueño", "Owner")}</p>
        <ul className="flex flex-col gap-sp-2 text-sm">
          {owners.map((o) => (
            <li key={o.email} className="flex flex-wrap items-center gap-sp-2">
              <span className="font-semibold text-ink">{o.email}</span>
              <span className="rounded-full bg-ink px-[8px] py-px font-mono text-[10px] uppercase text-cream">{t("Dueño · todos los roles", "Owner · all roles")}</span>
              <span className="text-xs text-ink/50">{o.account ? `${t("Cuenta", "Account")}: ${o.account}` : t("Sin cuenta todavía", "No account yet")}</span>
            </li>
          ))}
        </ul>
        <p className="mt-sp-2 text-xs text-ink/50">{t("El Dueño se define en Vercel con PLATFORM_ADMIN_EMAILS.", "The Owner is set in Vercel with PLATFORM_ADMIN_EMAILS.")}</p>
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Equipo", "Team")} ({members.length})</p>
        {members.length === 0 && <p className="text-sm text-ink/60">{t("Todavía no agregaste a nadie.", "You haven't added anyone yet.")}</p>}
        <ul className="flex flex-col gap-sp-4">
          {members.map((m) => (
            <li key={m.id} className={`flex flex-col gap-sp-2 border-t border-line pt-sp-4 first:border-0 first:pt-0 ${m.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-sp-2">
                <span className="font-semibold text-ink">{m.name || m.email}</span>
                {m.name && <span className="text-sm text-ink/60">{m.email}</span>}
                <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${m.account ? "bg-sage/30 text-cobalt-ink" : "bg-lime/40 text-ink"}`}>
                  {m.account ? `${t("Cuenta", "Account")}: ${m.account}` : t("Sin cuenta todavía", "No account yet")}
                </span>
                {!m.active && <span className="rounded-full bg-red-50 px-[8px] py-px font-mono text-[10px] uppercase text-red-700">{t("Acceso pausado", "Access paused")}</span>}
              </div>
              <RoleChecks
                value={m.roles}
                disabled={busy}
                onChange={(next) => next.length && call(`/api/admin/team/members/${m.id}`, "PATCH", { roles: next }).then((ok) => ok && showToast("success", t("Roles actualizados", "Roles updated")))}
              />
              <div className="flex flex-wrap gap-sp-3">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={busy}
                  onClick={() => call(`/api/admin/team/members/${m.id}`, "PATCH", { active: !m.active }).then((ok) => ok && showToast("success", m.active ? t("Acceso pausado", "Access paused") : t("Acceso reactivado", "Access reactivated")))}
                >
                  {m.active ? t("Pausar acceso", "Pause access") : t("Reactivar acceso", "Reactivate access")}
                </button>
                <button
                  type="button"
                  className={dangerLinkClass}
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t(`¿Quitar a ${m.name || m.email} del equipo? Su cuenta de Foliocrew sigue igual.`, `Remove ${m.name || m.email} from the team? Their Foliocrew account stays the same.`))) {
                      call(`/api/admin/team/members/${m.id}`, "DELETE").then((ok) => ok && showToast("success", t("Persona quitada del equipo", "Person removed from the team")));
                    }
                  }}
                >
                  {t("Quitar del equipo", "Remove from team")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
