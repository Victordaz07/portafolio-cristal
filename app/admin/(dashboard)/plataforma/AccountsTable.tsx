"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass } from "@/lib/admin-ui";

export interface AccountRow {
  id: string;
  name: string;
  slug: string;
  siteUrl: string;
  email: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  onboarded: boolean;
  content: number;
  brands: number;
  messages: number;
  networks: string[];
  aiThisMonth: number;
  status: string;
  hasNote: boolean;
  plan: string;
  billing: string;
  billingState: string;
  billingUntil: string | null;
  isMine: boolean;
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" }) : "—");

export async function impersonate(creatorId: string) {
  const response = await fetch("/api/admin/platform/impersonate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorId }),
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return response.ok ? null : body.error ?? "No se pudo entrar";
}

export async function setStatus(creatorId: string, status: "active" | "paused") {
  const response = await fetch(`/api/admin/platform/creators/${creatorId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return response.ok ? null : body.error ?? "No se pudo actualizar";
}

export default function AccountsTable({ rows }: { rows: AccountRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => `${r.name} ${r.slug} ${r.email}`.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  async function enterAs(row: AccountRow) {
    if (!window.confirm(`¿Entrar al panel de ${row.name} para darle soporte? Queda registrado.`)) return;
    setBusy(row.id);
    const error = await impersonate(row.id);
    if (error) {
      setBusy(null);
      return showToast("error", error);
    }
    router.push("/admin");
    router.refresh();
  }

  async function toggle(row: AccountRow) {
    const pause = row.status === "active";
    const message = pause
      ? `¿Pausar la cuenta de ${row.name}? Su sitio deja de verse y no puede entrar al panel. No se borra nada.`
      : `¿Reactivar la cuenta de ${row.name}?`;
    if (!window.confirm(message)) return;
    setBusy(row.id);
    const error = await setStatus(row.id, pause ? "paused" : "active");
    setBusy(null);
    if (error) return showToast("error", error);
    showToast("success", pause ? "Cuenta pausada" : "Cuenta reactivada");
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3">
        <input
          type="search"
          placeholder="Buscar por nombre, dirección o correo"
          aria-label="Buscar cuentas"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} max-w-xs`}
        />
        <p className="text-xs text-ink/50">
          {filtered.length} de {rows.length} cuentas
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
            <tr>
              <th className="py-sp-2 pr-sp-3">Cuenta</th>
              <th className="py-sp-2 pr-sp-3">Correo</th>
              <th className="py-sp-2 pr-sp-3">Alta</th>
              <th className="py-sp-2 pr-sp-3">Último ingreso</th>
              <th className="py-sp-2 pr-sp-3">Plan</th>
              <th className="py-sp-2 pr-sp-3">Sitio</th>
              <th className="py-sp-2 pr-sp-3" title="Piezas en el Feed · marcas · mensajes">Uso</th>
              <th className="py-sp-2 pr-sp-3">IA (mes)</th>
              <th className="py-sp-2 pr-sp-3">Estado</th>
              <th className="py-sp-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="py-sp-2 pr-sp-3">
                  <Link href={`/admin/plataforma/${r.id}`} className="font-semibold text-ink hover:text-coral">
                    {r.name}
                  </Link>
                  {r.isMine && <span className="ml-1 text-xs text-ink/45">(tú)</span>}
                  {r.hasNote && <span className="ml-1" title="Tiene nota interna">📝</span>}
                  <a href={r.siteUrl} target="_blank" rel="noreferrer" className="block font-mono text-xs text-coral hover:underline">
                    {r.siteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </td>
                <td className="py-sp-2 pr-sp-3">
                  <span className="break-all">{r.email}</span>
                  <span className={`block text-xs ${r.verified ? "text-cobalt-ink" : "text-ink/45"}`}>
                    {r.verified ? "✓ confirmado" : "sin confirmar"}
                  </span>
                </td>
                <td className="py-sp-2 pr-sp-3 text-ink/70">{date(r.createdAt)}</td>
                <td className="py-sp-2 pr-sp-3 text-ink/70">{date(r.lastLoginAt)}</td>
                <td className="py-sp-2 pr-sp-3 text-xs">
                  <span className="font-semibold text-ink">{r.plan}</span>
                  <span
                    className={`block ${r.billingState === "expired" || r.billingState === "none" ? "text-red-600" : "text-ink/55"}`}
                  >
                    {r.billingState === "comp" ? "no vence" : `${r.billing}${r.billingUntil ? ` · ${date(r.billingUntil)}` : ""}`}
                  </span>
                </td>
                <td className="py-sp-2 pr-sp-3 text-xs text-ink/70">
                  {r.onboarded ? "Asistente ✓" : "Asistente pendiente"}
                  <span className="block">{r.networks.length ? r.networks.join(", ") : "sin redes"}</span>
                </td>
                <td className="py-sp-2 pr-sp-3 font-mono text-xs text-ink/70">
                  {r.content} · {r.brands} · {r.messages}
                </td>
                <td className="py-sp-2 pr-sp-3 font-mono">{r.aiThisMonth}</td>
                <td className="py-sp-2 pr-sp-3">
                  <span
                    className={`rounded-full px-[8px] py-0.5 font-mono text-[10px] uppercase ${
                      r.status === "active" ? "bg-sage/30 text-cobalt-ink" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.status === "active" ? "Activa" : "Pausada"}
                  </span>
                </td>
                <td className="py-sp-2">
                  <div className="flex flex-wrap gap-sp-2 text-xs font-semibold">
                    {!r.isMine && (
                      <button type="button" disabled={busy === r.id} onClick={() => enterAs(r)} className="text-coral hover:underline disabled:opacity-50">
                        Entrar como
                      </button>
                    )}
                    {!r.isMine && (
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => toggle(r)}
                        className={`${r.status === "active" ? "text-red-600" : "text-cobalt-ink"} hover:underline disabled:opacity-50`}
                      >
                        {r.status === "active" ? "Pausar" : "Reactivar"}
                      </button>
                    )}
                    <Link href={`/admin/plataforma/${r.id}`} className="text-ink/60 hover:underline">
                      Ver
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
