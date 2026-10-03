import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { platformAdminUser } from "@/lib/platform-admin";
import { creatorSiteUrl } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountActions from "./AccountActions";
import BillingCard from "./BillingCard";
import OwnerEmailForm from "./OwnerEmailForm";
import { kindInfo } from "@/lib/creator-kind";
import { PLANS } from "@/lib/plans";
import { creatorPerformance } from "@/lib/platform-analytics";
import { formatCompact } from "@/lib/metrics";
import { BILLING_LABEL, PAYMENT_METHODS, billingState, formatMoney, getPlan, type PaymentMethod } from "@/lib/billing";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  pause: "Pausó la cuenta",
  activate: "Reactivó la cuenta",
  impersonate: "Entró como esta cuenta",
  note: "Cambió la nota interna",
  payment: "Confirmó un pago",
  "payment-rejected": "Marcó un pago como no encontrado",
  "comp-on": "Hizo la cuenta de cortesía",
  "comp-off": "Quitó la cortesía",
  plan: "Cambió el plan",
  trial: "Extendió la prueba gratis",
  email: "Cambió el correo de acceso",
};

const fmt = (d: Date | null | undefined) =>
  d ? d.toLocaleString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function PlatformAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await platformAdminUser();
  if (!admin) notFound();
  const { id } = await params;
  const creator = await prismaRoot.creator.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "asc" }, select: { email: true, name: true, role: true, emailVerifiedAt: true, lastLoginAt: true, createdAt: true } },
      socialAccounts: { select: { platform: true, username: true, followers: true } },
      _count: { select: { contentCards: true, brands: true, contactMessages: true, scheduledPosts: true, goals: true } },
    },
  });
  if (!creator) notFound();

  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5, 1));
  const [usage, actions, siteUrl, payments, perf] = await Promise.all([
    prismaRoot.aiUsage.findMany({ where: { creatorId: id, createdAt: { gte: since } }, select: { createdAt: true, inputTokens: true, outputTokens: true } }),
    prismaRoot.platformAction.findMany({ where: { creatorId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    creatorSiteUrl(creator),
    prismaRoot.payment.findMany({ where: { creatorId: id }, orderBy: { createdAt: "desc" }, take: 30 }),
    creatorPerformance(id),
  ]);
  const billing = billingState(creator);
  const byMonth = new Map<string, { count: number; tokens: number }>();
  for (const u of usage) {
    const key = u.createdAt.toISOString().slice(0, 7);
    const row = byMonth.get(key) ?? { count: 0, tokens: 0 };
    row.count += 1;
    row.tokens += u.inputTokens + u.outputTokens;
    byMonth.set(key, row);
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const isMine = creator.id === admin.creatorId;

  const facts: [string, string][] = [
    ["Dirección", siteUrl.replace(/^https?:\/\//, "")],
    ["Dominio propio", creator.customDomain ? `${creator.customDomain}${creator.customDomainVerifiedAt ? " ✓" : " (pendiente)"}` : "—"],
    ["Tipo de creador", kindInfo(creator.creatorKind).label],
    ["Alta", fmt(creator.createdAt)],
    ["Asistente de bienvenida", creator.onboardedAt ? `Terminado ${fmt(creator.onboardedAt)}` : "Pendiente"],
    ["Feed / marcas / mensajes", `${creator._count.contentCards} / ${creator._count.brands} / ${creator._count.contactMessages}`],
    ["Publicaciones programadas / metas", `${creator._count.scheduledPosts} / ${creator._count.goals}`],
    [
      "Redes conectadas",
      creator.socialAccounts.length
        ? creator.socialAccounts.map((s) => `${s.platform}${s.username ? ` @${s.username.replace(/^@/, "")}` : ""}`).join(", ")
        : "Ninguna",
    ],
  ];

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Foliocrew · Cuentas" title={creator.name} description={`Ficha de soporte de ${creator.slug}.`} />
      <Link href="/admin/plataforma" className="-mt-sp-3 text-sm font-medium text-coral hover:underline">
        ← Todas las cuentas
      </Link>
      <AccountActions
        creatorId={creator.id}
        name={creator.name}
        status={creator.status}
        note={creator.adminNote ?? ""}
        isMine={isMine}
        siteUrl={siteUrl}
      />
      <BillingCard
        creatorId={creator.id}
        plan={creator.plan}
        comp={creator.comp}
        stateLabel={BILLING_LABEL[billing.state]}
        until={billing.until?.toISOString() ?? null}
        plans={PLANS.map((p) => ({ id: p.id, name: p.name, price: p.price }))}
        payments={payments.map((p) => ({
          id: p.id,
          date: p.createdAt.toISOString(),
          plan: getPlan(p.plan).name,
          months: p.months,
          amount: formatMoney(p.amountCents, p.currency),
          method: PAYMENT_METHODS[p.method as PaymentMethod] ?? p.method,
          reference: p.reference,
          status: p.status,
          periodEnd: p.periodEnd?.toISOString() ?? null,
        }))}
      />
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Rendimiento del contenido</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Engagement mediano", perf.medianEr == null ? "—" : `${perf.medianEr}%`],
            ["Mediana de su nicho", perf.nicheMedianEr == null ? "—" : `${perf.nicheMedianEr}%`],
            ["Mediana de la plataforma", perf.platformMedianEr == null ? "—" : `${perf.platformMedianEr}%`],
            ["Publicaciones medidas", String(perf.posts)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[14px] bg-cream p-sp-3">
              <p className="font-fraunces text-2xl font-semibold text-ink">{value}</p>
              <p className="text-xs text-ink/60">{label}</p>
            </div>
          ))}
        </div>
        {perf.top.length > 0 && (
          <ul className="mt-sp-3 flex flex-col gap-1 text-sm">
            {perf.top.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-sp-2">
                <strong className="font-mono text-ink">{p.er}%</strong>
                <span className="text-xs text-ink/50">
                  {formatCompact(p.views)} vistas · {p.platform}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink/75">{p.caption || "(sin texto)"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="grid gap-sp-4 lg:grid-cols-2">
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">La cuenta</p>
          <dl className="grid gap-sp-2 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[11rem_1fr] gap-sp-2">
                <dt className="text-ink/55">{label}</dt>
                <dd className="break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Usuarios</p>
          <ul className="flex flex-col gap-sp-3 text-sm">
            {creator.users.map((u) => (
              <li key={u.email}>
                <p className="font-semibold text-ink">
                  {u.name ?? "—"} <span className="font-normal text-ink/50">({u.role === "owner" ? "dueño/a" : u.role})</span>
                </p>
                <p className="break-all">
                  {u.email} · {u.emailVerifiedAt ? "✓ correo confirmado" : "correo sin confirmar"}
                </p>
                <p className="text-xs text-ink/55">Último ingreso: {fmt(u.lastLoginAt)}</p>
                {!isMine && u.role === "owner" && <OwnerEmailForm creatorId={creator.id} name={creator.name} current={u.email} />}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Uso de IA (últimos 6 meses)</p>
          {months.length ? (
            <table className="w-full text-sm">
              <thead className="font-mono text-[10px] uppercase text-ink/50">
                <tr>
                  <th className="py-1 text-left">Mes</th>
                  <th className="py-1 text-right">Sugerencias</th>
                  <th className="py-1 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {months.map(([month, row]) => (
                  <tr key={month} className="border-t border-line">
                    <td className="py-1">{month}</td>
                    <td className="py-1 text-right font-mono">{row.count}</td>
                    <td className="py-1 text-right font-mono">{row.tokens.toLocaleString("es")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-ink/55">Todavía no pidió sugerencias de IA.</p>
          )}
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Historial de administración</p>
          {actions.length ? (
            <ul className="flex flex-col gap-sp-2 text-sm">
              {actions.map((a) => (
                <li key={a.id}>
                  <span className="text-ink">{ACTION_LABEL[a.action] ?? a.action}</span>
                  <span className="block text-xs text-ink/50">
                    {fmt(a.createdAt)} · {a.actorEmail}
                  {a.detail && a.action !== "note" ? ` · ${a.detail}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/55">Sin acciones todavía.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
