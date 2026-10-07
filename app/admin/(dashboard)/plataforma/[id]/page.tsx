import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { platformAdminUser } from "@/lib/platform-admin";
import { creatorSiteUrl, platformOrigin } from "@/lib/site-url";
import { referralLink } from "@/lib/ambassadors";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountActions from "./AccountActions";
import BillingCard from "./BillingCard";
import OwnerEmailForm from "./OwnerEmailForm";
import { kindInfo } from "@/lib/creator-kind";
import { PLANS } from "@/lib/plans";
import { creatorPerformance } from "@/lib/platform-analytics";
import { formatCompact } from "@/lib/metrics";
import { billingLabel, billingState, formatMoney, getPlan, paymentMethodLabel } from "@/lib/billing";
import { dateLocale, pickLabel, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

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
  "ambassador-on": "Dio el nivel Embajadora",
  "ambassador-off": "Quitó el nivel Embajadora",
  "ambassador-reward": "Premió a la embajadora con un mes gratis",
  plan: "Cambió el plan",
  trial: "Extendió la prueba gratis",
  email: "Cambió el correo de acceso",
};

const ACTION_LABEL_EN: Record<string, string> = {
  pause: "Paused the account",
  activate: "Reactivated the account",
  impersonate: "Signed in as this account",
  note: "Changed the internal note",
  payment: "Confirmed a payment",
  "payment-rejected": "Marked a payment as not found",
  "comp-on": "Made the account complimentary",
  "comp-off": "Removed complimentary",
  "ambassador-on": "Gave the Ambassador tier",
  "ambassador-off": "Removed the Ambassador tier",
  "ambassador-reward": "Rewarded the ambassador with a free month",
  plan: "Changed the plan",
  trial: "Extended the free trial",
  email: "Changed the sign-in email",
};

const fmtDate = (lang: AdminLang) => (d: Date | null | undefined) =>
  d ? d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function PlatformAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await platformAdminUser();
  if (!admin) notFound();
  const { t, lang } = await getT();
  const fmt = fmtDate(lang);
  const { id } = await params;
  const creator = await prismaRoot.creator.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "asc" }, select: { email: true, name: true, role: true, emailVerifiedAt: true, lastLoginAt: true, createdAt: true, totpEnabledAt: true } },
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
  const origin = await platformOrigin();
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
    [t("Dirección", "Address"), siteUrl.replace(/^https?:\/\//, "")],
    [t("Dominio propio", "Custom domain"), creator.customDomain ? `${creator.customDomain}${creator.customDomainVerifiedAt ? " ✓" : t(" (pendiente)", " (pending)")}` : "—"],
    [t("Tipo de creador", "Creator type"), pickLabel(lang, kindInfo(creator.creatorKind))],
    [t("Alta", "Joined"), fmt(creator.createdAt)],
    [t("Asistente de bienvenida", "Onboarding"), creator.onboardedAt ? t(`Terminado ${fmt(creator.onboardedAt)}`, `Done ${fmt(creator.onboardedAt)}`) : t("Pendiente", "Pending")],
    [t("Feed / marcas / mensajes", "Feed / brands / messages"), `${creator._count.contentCards} / ${creator._count.brands} / ${creator._count.contactMessages}`],
    [t("Publicaciones programadas / metas", "Scheduled posts / goals"), `${creator._count.scheduledPosts} / ${creator._count.goals}`],
    [
      t("Redes conectadas", "Connected networks"),
      creator.socialAccounts.length
        ? creator.socialAccounts.map((s) => `${s.platform}${s.username ? ` @${s.username.replace(/^@/, "")}` : ""}`).join(", ")
        : t("Ninguna", "None"),
    ],
  ];

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Foliocrew · Cuentas", "Foliocrew · Accounts")}
        title={creator.name}
        description={t(`Ficha de soporte de ${creator.slug}.`, `Support profile for ${creator.slug}.`)}
      />
      <Link href="/admin/plataforma" className="-mt-sp-3 text-sm font-medium text-coral hover:underline">
        {t("← Todas las cuentas", "← All accounts")}
      </Link>
      <AccountActions
        creatorId={creator.id}
        name={creator.name}
        status={creator.status}
        note={creator.adminNote ?? ""}
        isMine={isMine}
        siteUrl={siteUrl}
        twoFactor={creator.users.some((u) => u.totpEnabledAt)}
      />
      <BillingCard
        creatorId={creator.id}
        plan={creator.plan}
        comp={creator.comp}
        ambassador={creator.ambassador}
        referralLink={creator.ambassador && creator.referralCode ? referralLink(origin, creator.referralCode) : null}
        stateLabel={billingLabel(billing.state, lang)}
        until={billing.until?.toISOString() ?? null}
        plans={PLANS.map((p) => ({ id: p.id, name: p.name, price: p.price }))}
        payments={payments.map((p) => ({
          id: p.id,
          date: p.createdAt.toISOString(),
          plan: getPlan(p.plan).name,
          months: p.months,
          amount: formatMoney(p.amountCents, p.currency),
          method: paymentMethodLabel(p.method, lang),
          reference: p.reference,
          status: p.status,
          periodEnd: p.periodEnd?.toISOString() ?? null,
        }))}
      />
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Rendimiento del contenido", "Content performance")}</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            [t("Engagement mediano", "Median engagement"), perf.medianEr == null ? "—" : `${perf.medianEr}%`],
            [t("Mediana de su nicho", "Their niche median"), perf.nicheMedianEr == null ? "—" : `${perf.nicheMedianEr}%`],
            [t("Mediana de la plataforma", "Platform median"), perf.platformMedianEr == null ? "—" : `${perf.platformMedianEr}%`],
            [t("Publicaciones medidas", "Measured posts"), String(perf.posts)],
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
                  {formatCompact(p.views)} {t("vistas", "views")} · {p.platform}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink/75">{p.caption || t("(sin texto)", "(no text)")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="grid gap-sp-4 lg:grid-cols-2">
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("La cuenta", "The account")}</p>
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
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Usuarios", "Users")}</p>
          <ul className="flex flex-col gap-sp-3 text-sm">
            {creator.users.map((u) => (
              <li key={u.email}>
                <p className="font-semibold text-ink">
                  {u.name ?? "—"} <span className="font-normal text-ink/50">({u.role === "owner" ? t("dueño/a", "owner") : u.role})</span>
                </p>
                <p className="break-all">
                  {u.email} · {u.emailVerifiedAt ? t("✓ correo confirmado", "✓ email confirmed") : t("correo sin confirmar", "email unconfirmed")}
                </p>
                <p className="text-xs text-ink/55">
                  {t("Último ingreso:", "Last sign-in:")} {fmt(u.lastLoginAt)}
                </p>
                {!isMine && u.role === "owner" && <OwnerEmailForm creatorId={creator.id} name={creator.name} current={u.email} />}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Uso de IA (últimos 6 meses)", "AI usage (last 6 months)")}</p>
          {months.length ? (
            <table className="w-full text-sm">
              <thead className="font-mono text-[10px] uppercase text-ink/50">
                <tr>
                  <th className="py-1 text-left">{t("Mes", "Month")}</th>
                  <th className="py-1 text-right">{t("Sugerencias", "Suggestions")}</th>
                  <th className="py-1 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {months.map(([month, row]) => (
                  <tr key={month} className="border-t border-line">
                    <td className="py-1">{month}</td>
                    <td className="py-1 text-right font-mono">{row.count}</td>
                    <td className="py-1 text-right font-mono">{row.tokens.toLocaleString(dateLocale(lang))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-ink/55">{t("Todavía no pidió sugerencias de IA.", "No AI suggestions requested yet.")}</p>
          )}
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Historial de administración", "Admin history")}</p>
          {actions.length ? (
            <ul className="flex flex-col gap-sp-2 text-sm">
              {actions.map((a) => (
                <li key={a.id}>
                  <span className="text-ink">{(lang === "en" ? ACTION_LABEL_EN : ACTION_LABEL)[a.action] ?? a.action}</span>
                  <span className="block text-xs text-ink/50">
                    {fmt(a.createdAt)} · {a.actorEmail}
                  {a.detail && a.action !== "note" ? ` · ${a.detail}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/55">{t("Sin acciones todavía.", "No actions yet.")}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
