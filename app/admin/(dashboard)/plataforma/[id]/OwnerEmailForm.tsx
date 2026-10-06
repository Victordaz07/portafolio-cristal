"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

/** Soporte: corregir el correo con el que entra la dueña de una cuenta (queda registrado y se le avisa al correo anterior). */
export default function OwnerEmailForm({ creatorId, name, current }: { creatorId: string; name: string; current: string }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (
      !window.confirm(
        t(
          `¿Cambiar el correo de acceso de ${name} de ${current} a ${email}? Desde ahora entrará con el nuevo; le avisamos al anterior.`,
          `Change ${name}'s sign-in email from ${current} to ${email}? They'll sign in with the new one from now on; we'll notify the old one.`
        )
      )
    )
      return;
    setBusy(true);
    const response = await fetch(`/api/admin/platform/creators/${creatorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerEmail: email }),
    });
    setBusy(false);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo cambiar el correo", "Couldn't change the email"));
    showToast("success", t(`Ahora entra con ${data.email}. Le mandamos el enlace para confirmarlo.`, `They now sign in with ${data.email}. We sent the confirmation link.`));
    setOpen(false);
    setEmail("");
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 text-xs font-semibold text-coral hover:underline">
        {t("Cambiar correo de acceso", "Change sign-in email")}
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
        placeholder={t("correo@ejemplo.com", "email@example.com")}
        aria-label={t("Correo nuevo", "New email")}
        className={`${inputClass} min-w-[220px] flex-1`}
      />
      <button type="submit" disabled={busy} className={secondaryButtonClass}>
        {busy ? t("Cambiando…", "Changing…") : t("Cambiar", "Change")}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/55 hover:text-ink">
        {t("Cancelar", "Cancel")}
      </button>
    </form>
  );
}
