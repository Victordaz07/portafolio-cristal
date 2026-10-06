import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import {
  billingLabel,
  paymentMethodLabel,
  PAYABLE_PLANS,
  billingState,
  formatMoney,
  getPlan,
  paymentInstructions,
  paymentReference,
  priceCents,
} from "@/lib/billing";
import { dateLocale, plural, type AdminLang } from "@/lib/admin-lang";
import PayForm from "./PayForm";
import { aiQuota } from "@/lib/ai";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date, lang: AdminLang) => d.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const STATUS: Record<string, [string, string]> = {
  reported: ["Por confirmar", "Awaiting confirmation"],
  confirmed: ["Confirmado", "Confirmed"],
  rejected: ["No encontrado", "Not found"],
};

export default async function PlanPage() {
  const { t, lang } = await getT();
  const session = await getSession();
  const [creator, payments] = await Promise.all([
    session
      ? prismaRoot.creator.findUnique({
          where: { id: session.creatorId },
          select: { slug: true, plan: true, comp: true, ambassador: true, trialEndsAt: true, paidUntil: true },
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
  const fmt = (d: Date) => fmtDate(d, lang);

  const headline =
    state === "comp"
      ? t("Tu cuenta es de cortesía: no tienes que pagar nada. 💜", "Your account is complimentary: you don't have to pay anything. 💜")
      : state === "ambassador"
        ? t("Eres embajadora de Foliocrew: tienes Folio Pro sin pagar y sin vencimiento. 💜", "You're a Foliocrew ambassador: you have Folio Pro with nothing to pay and no expiry. 💜")
      : state === "active"
        ? t(`Tu plan ${plan.name} está pagado hasta el ${fmt(until!)}.`, `Your ${plan.name} plan is paid until ${fmt(until!)}.`)
        : state === "trial"
          ? t(
              `Estás en tu prueba gratis: te quedan ${plural("es", daysLeft ?? 0, ["día", "días"], ["day", "days"])} (hasta el ${fmt(until!)}).`,
              `You're on your free trial: ${plural("en", daysLeft ?? 0, ["día", "días"], ["day", "days"])} left (until ${fmt(until!)}).`
            )
          : state === "expired"
            ? t(`Tu plan venció el ${fmt(until!)}. Renueva para seguir sin cortes.`, `Your plan expired on ${fmt(until!)}. Renew to keep going without interruptions.`)
            : t("Todavía no tienes un plan pagado.", "You don't have a paid plan yet.");

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Ayuda", "Help")}
        title={t("Mi plan", "My plan")}
        description={t("Tu plan, cómo pagar y tus pagos. Sin renovación automática: te avisamos antes de que venza.", "Your plan, how to pay and your payments. No automatic renewal: we'll remind you before it expires.")}
      />
      <Card>
        <div className="flex flex-wrap items-center gap-sp-3">
          <span
            className={`rounded-full px-[10px] py-1 font-mono text-[11px] uppercase ${
              state === "expired" ? "bg-red-50 text-red-700" : state === "trial" ? "bg-coral/10 text-coral" : "bg-sage/30 text-cobalt-ink"
            }`}
          >
            {billingLabel(state, lang)}
          </span>
          <span className="font-semibold text-ink">{state === "comp" ? t("Cortesía", "Complimentary") : state === "ambassador" ? t("Embajadora · Folio Pro", "Ambassador · Folio Pro") : plan.name}</span>
        </div>
        <p className="mt-sp-2 text-ink">{headline}</p>
        {pending && (
          <p className="mt-sp-2 text-sm text-ink/70">
            ⏳{" "}
            {t(
              `Recibimos tu aviso de pago de ${formatMoney(pending.amountCents)} (${paymentMethodLabel(pending.method)}). Lo confirmamos en cuanto lo veamos y te llega un correo.`,
              `We got your payment notice for ${formatMoney(pending.amountCents)} (${paymentMethodLabel(pending.method, "en")}). We'll confirm it as soon as we see it and you'll get an email.`
            )}
          </p>
        )}
      </Card>
      {ai && (
        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Sugerencias de IA este mes", "AI suggestions this month")}</p>
          <p className="text-sm text-ink">
            <strong>{ai.used}</strong>{" "}
            {t(
              `de ${ai.limit} usadas · captions, consejos y “Diséñalo por mí” cuentan 1 cada uno. Se renueva el día 1.`,
              `of ${ai.limit} used · captions, tips and “Design it for me” count 1 each. It resets on the 1st.`
            )}
          </p>
          <div className="mt-sp-2 h-2 overflow-hidden rounded-full bg-cream" aria-hidden>
            <div className="h-full rounded-full bg-coral" style={{ width: `${Math.min(100, Math.round((ai.used / ai.limit) * 100))}%` }} />
          </div>
        </Card>
      )}

      {state !== "comp" && state !== "ambassador" && (
        <>
          <div className="grid gap-sp-4 md:grid-cols-2">
            {PAYABLE_PLANS.map((p) => (
              <Card key={p.id}>
                <p className="font-fraunces text-2xl font-semibold text-ink">{p.name}</p>
                <p className="text-sm text-ink/60">{lang === "en" ? p.taglineEn : p.tagline}</p>
                <p className="mt-sp-3 text-ink">
                  <strong className="text-2xl">{formatMoney(priceCents(p.id, 1))}</strong> {t("al mes", "per month")} ·{" "}
                  <span className="text-sm text-ink/70">
                    {formatMoney(priceCents(p.id, 12))} {t("al año (2 meses de regalo)", "per year (2 months free)")}
                  </span>
                </p>
                <ul className="mt-sp-3 list-disc pl-sp-4 text-sm text-ink/75">
                  {(lang === "en" ? p.featuresEn : p.features).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <Card>
            <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cómo pagar", "How to pay")}</p>
            <ol className="list-decimal pl-sp-4 text-sm text-ink">
              <li>{t("Elige tu plan y por cuánto tiempo (1, 3 o 12 meses).", "Choose your plan and for how long (1, 3 or 12 months).")}</li>
              <li>
                {t("Paga por PayPal o transferencia y escribe en el concepto tu referencia:", "Pay by PayPal or bank transfer and write your reference in the payment note:")}{" "}
                <span className="rounded bg-cream px-1.5 py-0.5 font-mono font-semibold">{reference}</span>
              </li>
              <li>{t("Avísanos con el formulario de abajo. Lo confirmamos y te llega un correo.", "Let us know with the form below. We confirm it and you get an email.")}</li>
            </ol>
            {!instructions.paypal && !instructions.transfer && (
              <p className="mt-sp-3 text-sm text-ink/70">{t("Escríbenos y te mandamos los datos para pagar.", "Write to us and we'll send you the payment details.")}</p>
            )}
            {instructions.transfer && (
              <div className="mt-sp-4">
                <p className="text-sm font-semibold text-ink">{t("Transferencia bancaria", "Bank transfer")}</p>
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
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tus pagos", "Your payments")}</p>
          <table className="w-full text-sm">
            <thead className="font-mono text-[10px] uppercase text-ink/50">
              <tr>
                <th className="py-1 text-left">{t("Fecha", "Date")}</th>
                <th className="py-1 text-left">{t("Plan", "Plan")}</th>
                <th className="py-1 text-left">{t("Monto", "Amount")}</th>
                <th className="py-1 text-left">{t("Método", "Method")}</th>
                <th className="py-1 text-left">{t("Estado", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-1.5">{fmt(p.createdAt)}</td>
                  <td className="py-1.5">
                    {getPlan(p.plan).name} · {plural(lang, p.months, ["mes", "meses"], ["month", "months"])}
                  </td>
                  <td className="py-1.5 font-mono">{formatMoney(p.amountCents, p.currency)}</td>
                  <td className="py-1.5">{paymentMethodLabel(p.method, lang)}</td>
                  <td className="py-1.5">
                    {STATUS[p.status] ? t(...STATUS[p.status]) : p.status}
                    {p.status === "confirmed" && p.periodEnd ? ` · ${t("hasta", "until")} ${fmt(p.periodEnd)}` : ""}
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
