"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

/** Acciones de un acuerdo: enviar, copiar el enlace, retirar, reabrir (si pidieron cambios) o borrar el borrador. */
export default function ContractAdminActions({ id, status, link, hasEmail, readOnly }: { id: string; status: string; link: string; hasEmail: boolean; readOnly: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "send" | "withdraw" | "delete">(null);

  async function call(url: string, method: string, body: unknown, success: string, after?: () => void) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = (await response.json().catch(() => ({}))) as { error?: string; emailed?: boolean };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", data.emailed === false ? t("Marcado como enviado (el correo no está configurado: comparte el enlace)", "Marked as sent (email isn't set up: share the link)") : success);
    if (after) after();
    else router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(link).catch(() => null);
    showToast("success", t("Enlace copiado", "Link copied"));
  }

  if (readOnly) return null;
  return (
    <div className="flex flex-wrap items-center gap-sp-2">
      {(status === "draft" || status === "sent") && (
        <button type="button" disabled={busy || !hasEmail} onClick={() => setConfirm("send")} className={primaryButtonClass} title={hasEmail ? undefined : t("Agrega el correo de la marca", "Add the brand's email")}>
          {status === "draft" ? t("✉️ Enviar a la marca", "✉️ Send to the brand") : t("✉️ Reenviar", "✉️ Resend")}
        </button>
      )}
      {status === "declined" && (
        <button type="button" disabled={busy} onClick={() => call(`/api/admin/contracts/${id}`, "PATCH", { action: "reopen" }, t("Vuelve a ser un borrador: edítalo y envíalo", "It's a draft again: edit it and send it"))} className={primaryButtonClass}>
          {t("✏️ Editar y volver a enviar", "✏️ Edit and resend")}
        </button>
      )}
      {status !== "draft" && (
        <button type="button" onClick={copy} className={secondaryButtonClass}>
          {t("🔗 Copiar enlace", "🔗 Copy link")}
        </button>
      )}
      <a href={link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-coral hover:underline">
        {t("Ver como la marca ↗", "View as the brand ↗")}
      </a>
      {status === "sent" && (
        <button type="button" onClick={() => setConfirm("withdraw")} className="text-xs text-ink/40 hover:text-red-600">
          {t("Retirar para editar", "Withdraw to edit")}
        </button>
      )}
      {status === "draft" && (
        <button type="button" onClick={() => setConfirm("delete")} className="text-xs text-ink/40 hover:text-red-600">
          {t("Borrar borrador", "Delete draft")}
        </button>
      )}

      {confirm === "send" && (
        <ConfirmDialog
          title={status === "draft" ? t("¿Enviar el acuerdo?", "Send the agreement?") : t("¿Reenviar el acuerdo?", "Resend the agreement?")}
          description={t("La marca recibe un correo con un enlace para leerlo y aceptarlo en línea. Quedan guardados su nombre, correo, fecha, hora y dirección IP. Cuando lo acepte, los dos reciben una copia.", "The brand gets an email with a link to read and accept it online. Its name, email, date, time and IP address are recorded. When they accept, you both get a copy.")}
          confirmLabel={t("Enviar", "Send")}
          onConfirm={() => {
            setConfirm(null);
            call(`/api/admin/contracts/${id}/send`, "POST", null, t("Acuerdo enviado ✉️", "Agreement sent ✉️"));
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "withdraw" && (
        <ConfirmDialog
          title={t("¿Retirar el acuerdo?", "Withdraw the agreement?")}
          description={t("Vuelve a ser un borrador y el enlace deja de funcionar hasta que lo envíes de nuevo.", "It goes back to a draft and the link stops working until you send it again.")}
          confirmLabel={t("Retirar", "Withdraw")}
          onConfirm={() => {
            setConfirm(null);
            call(`/api/admin/contracts/${id}`, "PATCH", { action: "withdraw" }, t("Acuerdo retirado", "Agreement withdrawn"));
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          title={t("¿Borrar el borrador?", "Delete the draft?")}
          description={t("No se puede deshacer.", "This can't be undone.")}
          confirmLabel={t("Borrar", "Delete")}
          onConfirm={() => {
            setConfirm(null);
            call(`/api/admin/contracts/${id}`, "DELETE", null, t("Borrador borrado", "Draft deleted"), () => router.push("/admin/contratos"));
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
