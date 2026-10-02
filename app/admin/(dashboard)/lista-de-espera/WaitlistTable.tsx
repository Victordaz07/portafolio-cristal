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
  invited: boolean;
  createdAt: string;
}

export default function WaitlistTable({ entries, inviteCodeSet }: { entries: Row[]; inviteCodeSet: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function mark(invited: boolean) {
    const response = await fetch("/api/admin/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), invited }),
    });
    if (!response.ok) return showToast("error", "No se pudo actualizar");
    showToast("success", invited ? "Marcadas como invitadas" : "De vuelta en espera");
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
          Para invitar: mándales el link de registro (<span className="font-mono">/admin/registro</span>) con tu código de invitación
          {inviteCodeSet ? "" : " (todavía no configuraste SIGNUP_INVITE_CODE en Vercel)"} y márcalas aquí como invitadas.
        </p>
        <div className="flex flex-wrap gap-sp-2">
          <button type="button" disabled={!selected.size} onClick={() => mark(true)} className={primaryButtonClass}>
            Marcar invitadas ({selected.size})
          </button>
          <button type="button" disabled={!selected.size} onClick={() => mark(false)} className={secondaryButtonClass}>
            Volver a espera
          </button>
          <a href="/api/admin/waitlist" className={secondaryButtonClass}>
            Descargar CSV
          </a>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-ink/55">Todavía nadie se anotó. Comparte tu página de venta: /foliocrew</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="py-sp-2 pr-sp-2">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todas"
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
                    <span className={`rounded-full px-[8px] py-0.5 font-mono text-[10px] uppercase ${r.invited ? "bg-sage/30 text-cobalt-ink" : "bg-cream text-ink/60"}`}>
                      {r.invited ? "Invitada" : "En espera"}
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
