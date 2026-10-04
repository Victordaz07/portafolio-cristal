import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import {
  BILLING_LABEL,
  PAYABLE_PLANS,
  PAYMENT_METHODS,
  billingState,
  formatMoney,
  getPlan,
  paymentInstructions,
  paymentReference,
  priceCents,
  type PaymentMethod,
} from "@/lib/billing";
import PayForm from "./PayForm";
import { aiQuota } from "@/lib/ai";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const STATUS: Record<string, string> = { reported: "Por confirmar", confirmed: "Confirmado", rejected: "No encontrado" };

export default async function PlanPage() {
  const session = await getSession();
  const [creator, payments] = await Promise.all([
    session
      ? prismaRoot.creator.findUnique({
          where: { id: session.creatorId },
          select: { slug: true, plan: true, comp: true, trialEndsAt: true, paidUntil: true },
        })
      : null,
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  if (!creator) return null;
  const ai = await aiQuota().catch(() => null);
  const { state, until, daysLeft } = billingState(creator);
  const plan = getPlan(creator.plan);
  const instructions = paymentInstructions();
  const reference = paymentReference(creator.slug);
  const pending = payments.find((p) => p.status === "reported");

  const headline =
    state === "comp"
      ? "Tu cuenta es de cortesía: no tienes que pagar nada. 💜"
      : state === "active"
        ? `Tu plan ${plan.name} está pagado hasta el ${fmt(until!)}.`
        : state === "trial"
          ? `Estás en tu prueba gratis: te quedan ${daysLeft} ${daysLeft === 1 ? "día" : "días"} (hasta el ${fmt(until!)}).`
          : state === "expired"
            ? `Tu plan venció el ${fmt(until!)}. Renueva para seguir sin cortes.`
            : "Todavía no tienes un plan pagado.";

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Ayuda" title="Mi plan" description="Tu plan, cómo pagar y tus pagos. Sin renovación automática: te avisamos antes de que venza." />
      <Card>
        <div className="flex flex-wrap items-center gap-sp-3">
          <span
            className={`rounded-full px-[10px] py-1 font-mono text-[11px] uppercase ${
              state === "expired" ? "bg-red-50 text-red-700" : state === "trial" ? "bg-coral/10 text-coral" : "bg-sage/30 text-cobalt-ink"
            }`}
          >
            {BILLING_LABEL[state]}
          </span>
          <span className="font-semibold text-ink">{state === "comp" ? "Cortesía" : plan.name}</span>
        </div>
        <p className="mt-sp-2 text-ink">{headline}</p>
        {pending && (
          <p className="mt-sp-2 text-sm text-ink/70">
            ⏳ Recibimos tu aviso de pago de {formatMoney(pending.amountCents)} ({PAYMENT_METHODS[pending.method as PaymentMethod] ?? pending.method}). Lo
            confirmamos en cuanto lo veamos y te llega un correo.
          </p>
        )}
      </Card>
      {ai && (
        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Sugerencias de IA este mes</p>
          <p className="text-sm text-ink">
            <strong>{ai.used}</strong> de {ai.limit} usadas · captions, consejos y “Diséñalo por mí” cuentan 1 cada uno. Se renueva el día 1.
          </p>
          <div className="mt-sp-2 h-2 overflow-hidden rounded-full bg-cream" aria-hidden>
            <div className="h-full rounded-full bg-coral" style={{ width: `${Math.min(100, Math.round((ai.used / ai.limit) * 100))}%` }} />
          </div>
        </Card>
      )}

      {state !== "comp" && (
        <>
          <div className="grid gap-sp-4 md:grid-cols-2">
            {PAYABLE_PLANS.map((p) => (
              <Card key={p.id}>
                <p className="font-fraunces text-2xl font-semibold text-ink">{p.name}</p>
                <p className="text-sm text-ink/60">{p.tagline}</p>
                <p className="mt-sp-3 text-ink">
                  <strong className="text-2xl">{formatMoney(priceCents(p.id, 1))}</strong> al mes ·{" "}
                  <span className="text-sm text-ink/70">{formatMoney(priceCents(p.id, 12))} al año (2 meses de regalo)</span>
                </p>
                <ul className="mt-sp-3 list-disc pl-sp-4 text-sm text-ink/75">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <Card>
            <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Cómo pagar</p>
            <ol className="list-decimal pl-sp-4 text-sm text-ink">
              <li>Elige tu plan y por cuánto tiempo (1, 3 o 12 meses).</li>
              <li>
                Paga por PayPal o transferencia y escribe en el concepto tu referencia:{" "}
                <span className="rounded bg-cream px-1.5 py-0.5 font-mono font-semibold">{reference}</span>
              </li>
              <li>Avísanos con el formulario de abajo. Lo confirmamos y te llega un correo.</li>
            </ol>
            {!instructions.paypal && !instructions.transfer && (
              <p className="mt-sp-3 text-sm text-ink/70">Escríbenos y te mandamos los datos para pagar.</p>
            )}
            {instructions.transfer && (
              <div className="mt-sp-4">
                <p className="text-sm font-semibold text-ink">Transferencia bancaria</p>
                <pre className="mt-sp-1 whitespace-pre-wrap rounded-[12px] bg-cream p-sp-3 font-mono text-sm text-ink">{instructions.transfer}</pre>
              </div>
            )}
          </Card>

          <PayForm
            plans={PAYABLE_PLANS.map((p) => ({ id: p.id, name: p.name, prices: { 1: priceCents(p.id, 1), 3: priceCents(p.id, 3), 12: priceCents(p.id, 12) } }))}
            defaultPlan={PAYABLE_PLANS.some((p) => p.id === creator.plan) ? creator.plan : "pro"}
            paypalUrl={instructions.paypal}
            hasTransfer={Boolean(instructions.transfer)}
          />
        </>
      )}

      {payments.length > 0 && (
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tus pagos</p>
          <table className="w-full text-sm">
            <thead className="font-mono text-[10px] uppercase text-ink/50">
              <tr>
                <th className="py-1 text-left">Fecha</th>
                <th className="py-1 text-left">Plan</th>
                <th className="py-1 text-left">Monto</th>
                <th className="py-1 text-left">Método</th>
                <th className="py-1 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-1.5">{fmt(p.createdAt)}</td>
                  <td className="py-1.5">
                    {getPlan(p.plan).name} · {p.months} {p.months === 1 ? "mes" : "meses"}
                  </td>
                  <td className="py-1.5 font-mono">{formatMoney(p.amountCents, p.currency)}</td>
                  <td className="py-1.5">{PAYMENT_METHODS[p.method as PaymentMethod] ?? p.method}</td>
                  <td className="py-1.5">
                    {STATUS[p.status] ?? p.status}
                    {p.status === "confirmed" && p.periodEnd ? ` · hasta ${fmt(p.periodEnd)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
