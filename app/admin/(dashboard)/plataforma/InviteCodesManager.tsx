"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, dangerLinkClass } from "@/lib/admin-ui";

export interface InviteCodeRow {
  id: string;
  code: string;
  label: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-full border border-line px-sp-3 py-1 text-xs text-ink hover:border-coral"
    >
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

export default function InviteCodesManager({ codes }: { codes: InviteCodeRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/platform/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label || undefined,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresInDays: expiresInDays ? Number(expiresInDays) : null,
      }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return showToast("error", body.error ?? "No se pudo crear");
    showToast("success", `Código creado: ${body.code.code}`);
    setLabel("");
    router.refresh();
  }

  async function toggle(id: string, active: boolean) {
    setBusy(true);
    await fetch(`/api/admin/platform/invite-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("¿Borrar este código? No se puede deshacer.")) return;
    setBusy(true);
    await fetch(`/api/admin/platform/invite-codes/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Crear código</p>
        <form onSubmit={create} className="flex flex-col gap-sp-3 md:flex-row md:items-end md:flex-wrap">
          <label className={`${labelClass} flex-1 min-w-[160px]`}>
            <span className="text-sm font-semibold text-ink">Para quién / nota (opcional)</span>
            <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Para la agencia de Juan" />
          </label>
          <label className={labelClass}>
            <span className="text-sm font-semibold text-ink">Usos</span>
            <input className={`${inputClass} w-28`} type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Sin tope" />
          </label>
          <label className={labelClass}>
            <span className="text-sm font-semibold text-ink">Vence en (días)</span>
            <input className={`${inputClass} w-28`} type="number" min={1} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder="Nunca" />
          </label>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            Crear código
          </button>
        </form>
        <p className="mt-sp-2 text-xs text-ink/60">Deja &quot;Usos&quot; vacío para que sirva sin límite de veces. El código único de Vercel (SIGNUP_INVITE_CODE) sigue funcionando igual, aparte de estos.</p>
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Códigos ({codes.length})</p>
        {codes.length === 0 ? (
          <p className="text-sm text-ink/60">Todavía no creaste ninguno.</p>
        ) : (
          <ul className="flex flex-col gap-sp-3">
            {codes.map((c) => {
              const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
              const expired = c.expiresAt ? new Date(c.expiresAt) <= new Date() : false;
              const usable = c.active && !exhausted && !expired;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-sp-3 border-t border-line pt-sp-3 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-sp-2">
                    <span className="font-mono text-base font-semibold text-ink">{c.code}</span>
                    <CopyButton text={c.code} />
                    <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${usable ? "bg-sage/30 text-cobalt-ink" : "bg-cream text-ink/55"}`}>
                      {!c.active ? "Desactivado" : exhausted ? "Agotado" : expired ? "Vencido" : "Activo"}
                    </span>
                    <span className="text-xs text-ink/55">
                      {c.usedCount} usado{c.usedCount === 1 ? "" : "s"}
                      {c.maxUses !== null ? ` de ${c.maxUses}` : " · sin tope"}
                      {c.expiresAt ? ` · vence ${new Date(c.expiresAt).toLocaleDateString("es-DO")}` : ""}
                    </span>
                    {c.label && <span className="text-xs text-ink/55">· {c.label}</span>}
                  </div>
                  <div className="flex gap-sp-3 text-sm">
                    <button type="button" className="text-ink/60 hover:text-coral" disabled={busy} onClick={() => toggle(c.id, !c.active)}>
                      {c.active ? "Desactivar" : "Activar"}
                    </button>
                    <button type="button" className={dangerLinkClass} disabled={busy} onClick={() => remove(c.id)}>
                      Borrar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
