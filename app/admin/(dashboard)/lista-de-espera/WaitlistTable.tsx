"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

interface Row {
  id: string;
  email: string;
  instagram: string | null;
  niche: string | null;
  audience: string | null;
  source: string;
  status: string;
  createdAt: string;
}

const STATUS: Record<string, { label: string; className: string }> = {
  waiting: { label: "En espera", className: "bg-cream text-ink/60" },
  invited: { label: "Invitación enviada", className: "bg-sage/30 text-cobalt-ink" },
  joined: { label: "Cuenta creada", className: "bg-coral/15 text-coral" },
};

export default function WaitlistTable({
  entries,
  inviteCodeSet,
  emailReady,
  registerUrl,
  landingUrl,
}: {
  entries: Row[];
  inviteCodeSet: boolean;
  emailReady: boolean;
  registerUrl: string;
  landingUrl: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  async function run(action: "email" | "invited" | "waiting") {
    if (action === "email" && !window.confirm(`¿Mandar la invitación por correo a ${selected.size} persona(s)? El correo incluye tu código de invitación.`)) return;
    setBusy(true);
    const response = await fetch("/api/admin/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action }),
    });
    setBusy(false);
    const body = (await response.json().catch(() => ({}))) as { error?: string; sent?: number; failed?: number };
    if (!response.ok) return showToast("error", body.error ?? "No se pudo actualizar");
    if (action === "email") {
      showToast(body.failed ? "error" : "success", `Invitaciones enviadas: ${body.sent ?? 0}${body.failed ? ` · fallaron: ${body.failed}` : ""}`);
    } else {
      showToast("success", action === "invited" ? "Invitación marcada como enviada" : "De vuelta en espera");
    }
    setSelected(new Set());
    router.refresh();
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card>
      <div className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3">
        <p className="text-sm text-ink/65">
          Para invitar: manda el link de registro{" "}
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(registerUrl).then(() => showToast("success", "Link copiado"))}
            className="font-mono text-coral hover:underline"
            title="Copiar link"
          >
            {registerUrl}
          </button>{" "}
          junto con tu código de invitación
          {inviteCodeSet ? "" : " (todavía no configuraste SIGNUP_INVITE_CODE en Vercel)"}, o selecciona personas y toca{" "}
          <strong>Invitar por correo</strong>: les llega el link y el código.
          {emailReady ? "" : " (Para mandar correos falta configurar RESEND_API_KEY en Vercel.)"}
        </p>
        <div className="flex flex-wrap gap-sp-2">
          <button
            type="button"
            disabled={!selected.size || busy || !emailReady || !inviteCodeSet}
            onClick={() => run("email")}
            className={primaryButtonClass}
          >
            {busy ? "Enviando…" : `Invitar por correo (${selected.size})`}
          </button>
          <button type="button" disabled={!selected.size || busy} onClick={() => run("invited")} className={secondaryButtonClass}>
            Marcar invitación enviada
          </button>
          <button type="button" disabled={!selected.size || busy} onClick={() => run("waiting")} className={secondaryButtonClass}>
            Volver a espera
          </button>
          <a href="/api/admin/waitlist" className={secondaryButtonClass}>
            Descargar CSV
          </a>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-ink/55">Todavía nadie se anotó. Comparte tu página de venta: {landingUrl}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="py-sp-2 pr-sp-2">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todo"
                    checked={selected.size === entries.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(entries.map((r) => r.id)) : new Set())}
                  />
                </th>
                <th className="py-sp-2 pr-sp-3">#</th>
                <th className="py-sp-2 pr-sp-3">Correo</th>
                <th className="py-sp-2 pr-sp-3">Instagram</th>
                <th className="py-sp-2 pr-sp-3">Nicho</th>
                <th className="py-sp-2 pr-sp-3">Seguidores</th>
                <th className="py-sp-2 pr-sp-3">Origen</th>
                <th className="py-sp-2 pr-sp-3">Fecha</th>
                <th className="py-sp-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((r, i) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-sp-2 pr-sp-2">
                    <input type="checkbox" aria-label={`Seleccionar ${r.email}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="py-sp-2 pr-sp-3 font-mono text-ink/55">{i + 1}</td>
                  <td className="py-sp-2 pr-sp-3">{r.email}</td>
                  <td className="py-sp-2 pr-sp-3">
                    {r.instagram ? (
                      <a href={`https://instagram.com/${r.instagram}`} target="_blank" rel="noreferrer" className="text-coral hover:underline">
                        @{r.instagram}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-sp-2 pr-sp-3">{r.niche ?? "—"}</td>
                  <td className="py-sp-2 pr-sp-3">{r.audience ?? "—"}</td>
                  <td className="py-sp-2 pr-sp-3 text-ink/60">{r.source || "directo"}</td>
                  <td className="py-sp-2 pr-sp-3 text-ink/60">{new Date(r.createdAt).toLocaleDateString("es")}</td>
                  <td className="py-sp-2">
                    <span className={`rounded-full px-[8px] py-0.5 font-mono text-[10px] uppercase ${STATUS[r.status]?.className ?? STATUS.waiting.className}`}>
                      {STATUS[r.status]?.label ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
