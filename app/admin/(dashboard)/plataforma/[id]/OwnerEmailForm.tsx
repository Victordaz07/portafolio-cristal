"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";

/** Soporte: corregir el correo con el que entra la dueña de una cuenta (queda registrado y se le avisa al correo anterior). */
export default function OwnerEmailForm({ creatorId, name, current }: { creatorId: string; name: string; current: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!window.confirm(`¿Cambiar el correo de acceso de ${name} de ${current} a ${email}? Desde ahora entrará con el nuevo; le avisamos al anterior.`)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/platform/creators/${creatorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerEmail: email }),
    });
    setBusy(false);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? "No se pudo cambiar el correo");
    showToast("success", `Ahora entra con ${data.email}. Le mandamos el enlace para confirmarlo.`);
    setOpen(false);
    setEmail("");
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 text-xs font-semibold text-coral hover:underline">
        Cambiar correo de acceso
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mt-sp-2 flex flex-wrap items-center gap-sp-2"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo-de-ella@ejemplo.com"
        aria-label="Correo nuevo"
        className={`${inputClass} min-w-[220px] flex-1`}
      />
      <button type="submit" disabled={busy} className={secondaryButtonClass}>
        {busy ? "Cambiando…" : "Cambiar"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/55 hover:text-ink">
        Cancelar
      </button>
    </form>
  );
}
