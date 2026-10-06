"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

/** Acciones de una factura en el panel: enviar, copiar enlace, marcar pagada, anular o borrar. */
export default function InvoiceAdminActions({
  id,
  status,
  link,
  hasEmail,
  readOnly,
}: {
  id: string;
  status: string;
  link: string;
  hasEmail: boolean;
  /** El equipo "entrando como" solo puede mirar */
  readOnly: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "void" | "delete" | "send">(null);

  async function call(url: string, method: string, body: unknown, success: string, after?: () => void) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = (await response.json().catch(() => ({}))) as { error?: string; emailed?: boolean };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", data.emailed === false ? t("Marcada como enviada (el correo no está configurado: comparte el enlace)", "Marked as sent (email isn't set up: share the link)") : success);
    if (after) after();
    else router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(link).catch(() => null);
    showToast("success", t("Enlace copiado", "Link copied"));
  }

  if (readOnly) return null;
  const open = status === "draft" || status === "sent";

  return (
    <div className="flex flex-wrap items-center gap-sp-2">
      {open && (
        <button type="button" disabled={busy || !hasEmail} onClick={() => setConfirm("send")} className={primaryButtonClass} title={hasEmail ? undefined : t("Agrega el correo de la marca", "Add the brand's email")}>
          {status === "draft" ? t("✉️ Enviar a la marca", "✉️ Send to the brand") : t("✉️ Reenviar", "✉️ Resend")}
        </button>
      )}
      {status === "sent" && (
        <button type="button" disabled={busy} onClick={() => call(`/api/admin/invoices/${id}`, "PATCH", { action: "markPaid" }, t("¡Factura pagada! 🎉", "Invoice paid! 🎉"))} className={secondaryButtonClass}>
          {t("✓ Marcar pagada", "✓ Mark as paid")}
        </button>
      )}
      {status === "paid" && (
        <button type="button" disabled={busy} onClick={() => call(`/api/admin/invoices/${id}`, "PATCH", { action: "markUnpaid" }, t("Marcada como no pagada", "Marked as unpaid"))} className={secondaryButtonClass}>
          {t("Deshacer pago", "Undo payment")}
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
        <button type="button" onClick={() => setConfirm("void")} className="text-xs text-ink/40 hover:text-red-600">
          {t("Anular", "Void")}
        </button>
      )}
      {status === "draft" && (
        <button type="button" onClick={() => setConfirm("delete")} className="text-xs text-ink/40 hover:text-red-600">
          {t("Borrar borrador", "Delete draft")}
        </button>
      )}

      {confirm === "send" && (
        <ConfirmDialog
          title={status === "draft" ? t("¿Enviar la factura?", "Send the invoice?") : t("¿Reenviar la factura?", "Resend the invoice?")}
          description={t(
            "La marca recibe un correo con el enlace. Si no la paga a tiempo, le mandamos recordatorios amables el día que vence y a los 7 y 14 días.",
            "The brand gets an email with the link. If it isn't paid on time, we send friendly reminders on the due date and at 7 and 14 days."
          )}
          confirmLabel={t("Enviar", "Send")}
          onConfirm={() => {
            setConfirm(null);
            call(`/api/admin/invoices/${id}/send`, "POST", null, t("Factura enviada ✉️", "Invoice sent ✉️"));
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "void" && (
        <ConfirmDialog
          title={t("¿Anular la factura?", "Void the invoice?")}
          description={t("Deja de contar como por cobrar y la marca la verá como anulada. El número no se reutiliza.", "It stops counting as receivable and the brand will see it as void. The number isn't reused.")}
          confirmLabel={t("Anular", "Void")}
          onConfirm={() => {
            setConfirm(null);
            call(`/api/admin/invoices/${id}`, "PATCH", { action: "void" }, t("Factura anulada", "Invoice voided"));
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
            call(`/api/admin/invoices/${id}`, "DELETE", null, t("Borrador borrado", "Draft deleted"), () => router.push("/admin/facturas"));
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
