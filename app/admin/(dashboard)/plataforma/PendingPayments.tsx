"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { dateLocale } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

export interface PendingPayment {
  id: string;
  creatorId: string;
  creatorName: string;
  plan: string;
  months: number;
  amount: string;
  method: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export async function decidePayment(id: string, action: "confirm" | "reject") {
  const response = await fetch(`/api/admin/platform/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return response.ok ? null : body.error ?? "No se pudo actualizar";
}

/** Pagos que la gente avisó ("ya pagué") y esperan que confirmes que el dinero llegó. */
export default function PendingPayments({ payments }: { payments: PendingPayment[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(p: PendingPayment, action: "confirm" | "reject") {
    const question =
      action === "confirm"
        ? t(
            `¿Confirmas que recibiste ${p.amount} de ${p.creatorName}? Su plan se activa y le llega un correo.`,
            `Confirm you received ${p.amount} from ${p.creatorName}? Their plan activates and they get an email.`
          )
        : t(
            `¿No encontraste el pago de ${p.creatorName}? Le pediremos el comprobante por correo.`,
            `Couldn't find ${p.creatorName}'s payment? We'll ask them for the receipt by email.`
          );
    if (!window.confirm(question)) return;
    setBusy(p.id);
    const error = await decidePayment(p.id, action);
    setBusy(null);
    if (error) return showToast("error", error);
    showToast("success", action === "confirm" ? t("Pago confirmado", "Payment confirmed") : t("Pago marcado como no encontrado", "Payment marked as not found"));
    router.refresh();
  }

  return (
    <Card>
      <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Pagos por confirmar", "Payments to confirm")}</p>
      {payments.length === 0 ? (
        <p className="text-sm text-ink/55">
          {t(
            "No hay pagos pendientes. Cuando alguien pague por PayPal o transferencia y toque “Ya pagué”, aparece aquí y te llega un correo.",
            "No pending payments. When someone pays via PayPal or bank transfer and taps “I paid”, it shows up here and you get an email."
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-sp-3">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-sp-3 rounded-[12px] border border-line p-sp-3 text-sm">
              <div>
                <Link href={`/admin/plataforma/${p.creatorId}`} className="font-semibold text-ink hover:text-coral">
                  {p.creatorName}
                </Link>{" "}
                · <strong>{p.amount}</strong> · {p.plan} · {p.months} {p.months === 1 ? t("mes", "month") : t("meses", "months")} · {p.method}
                <span className="block text-xs text-ink/55">
                  Ref.: {p.reference || "—"}
                  {p.note ? ` · ${p.note}` : ""} · {new Date(p.createdAt).toLocaleString(dateLocale(lang))}
                </span>
              </div>
              <div className="flex gap-sp-2 text-xs font-semibold">
                <button type="button" disabled={busy === p.id} onClick={() => decide(p, "confirm")} className="rounded-full bg-ink px-sp-3 py-1.5 text-cream hover:bg-coral disabled:opacity-50">
                  {t("Confirmar", "Confirm")}
                </button>
                <button type="button" disabled={busy === p.id} onClick={() => decide(p, "reject")} className="rounded-full border border-line px-sp-3 py-1.5 text-ink/70 hover:border-red-400 hover:text-red-600 disabled:opacity-50">
                  {t("No lo encuentro", "Can't find it")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
