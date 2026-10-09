import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import ReportPaymentForm from "./ReportPaymentForm";
import { billingLabel, billingState, formatMoney, paymentInstructions, paymentMethodLabel } from "@/lib/billing";

export default async function AgencyBillingPage() {
  const agency = await agencyUser();
  if (!agency) return null;
  const record = await prismaRoot.agency.findUniqueOrThrow({ where: { id: agency.agencyId } });
  const payments = await prismaRoot.agencyPayment.findMany({ where: { agencyId: agency.agencyId }, orderBy: { createdAt: "desc" }, take: 20 });
  const { state, until } = billingState({ ...record, plan: "crew" });
  const instructions = paymentInstructions();
  const pending = payments.find((p) => p.status === "reported");

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Agencia" title="Facturación" description="Tu plan Crew es a la medida: una sola factura por toda tu cartera." />
      <Card>
        <div className="flex flex-wrap items-center gap-sp-3">
          <span className="rounded-full bg-sage/30 px-[10px] py-1 font-mono text-[11px] uppercase text-cobalt-ink">{billingLabel(state)}</span>
          {until && <span className="text-sm text-ink/70">hasta {until.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</span>}
        </div>
        {pending && (
          <p className="mt-sp-2 text-sm text-ink/70">
            ⏳ Recibimos tu aviso de {formatMoney(pending.amountCents)} ({paymentMethodLabel(pending.method)}). Lo confirmamos en cuanto lo veamos.
          </p>
        )}
      </Card>

      {agency.owner && state !== "comp" && (
        <>
          <Card>
            <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Cómo pagar</p>
            {!instructions.paypal && !instructions.transfer ? (
              <p className="text-sm text-ink/70">Escríbenos y te mandamos los datos para pagar.</p>
            ) : (
              <>
                {instructions.paypal && (
                  <p className="text-sm text-ink">
                    PayPal:{" "}
                    <a href={instructions.paypal} target="_blank" rel="noreferrer" className="font-semibold text-coral hover:underline">
                      {instructions.paypal}
                    </a>
                  </p>
                )}
                {instructions.transfer && <pre className="mt-sp-2 whitespace-pre-wrap rounded-[12px] bg-cream p-sp-3 font-mono text-sm text-ink">{instructions.transfer}</pre>}
              </>
            )}
          </Card>
          <Card>
            <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Ya pagué</p>
            <ReportPaymentForm />
          </Card>
        </>
      )}

      {payments.length > 0 && (
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tus pagos</p>
          <ul className="flex flex-col gap-sp-2 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-sp-2 border-t border-line pt-sp-2 first:border-0 first:pt-0">
                <span>
                  {formatMoney(p.amountCents, p.currency)} · {paymentMethodLabel(p.method)} · {p.createdAt.toLocaleDateString("es-DO")}
                </span>
                <span className="text-ink/60">{p.status === "confirmed" ? "Confirmado" : p.status === "rejected" ? "No encontrado" : "Por confirmar"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
