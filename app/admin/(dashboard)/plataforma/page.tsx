import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { platformAdminUser } from "@/lib/platform-admin";
import { platformAccounts, startOfMonth } from "@/lib/platform-stats";
import { contentAnalytics, creatorLeaderboard, nicheBenchmarks, signupsByWeek, MIN_VIEWS } from "@/lib/platform-analytics";
import { NICHES } from "@/lib/onboarding";
import { NETWORK_META } from "@/lib/content-plan";
import { creatorSiteUrl } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountsTable from "./AccountsTable";
import PendingPayments from "./PendingPayments";
import LeaderboardTable from "./LeaderboardTable";
import IntelligenceSection from "./IntelligenceSection";
import DepartmentsSection from "./DepartmentsSection";
import { BarList, EngagementHeatmap, PlatformTabs, Stat, WeeklyBars, compact, eyebrowClass } from "./charts";
import { billingLabel, billingState, formatMoney, getPlan, paymentMethodLabel } from "@/lib/billing";
import { reportWord } from "@/lib/reports";
import { pickLabel } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const VIEWS = ["resumen", "creadores", "contenido", "nichos", "inteligencia", "cuentas", "departamentos"];
const networkLabel = (key: string) => (key in NETWORK_META ? NETWORK_META[key as keyof typeof NETWORK_META].label : key);

export default async function PlatformPage({ searchParams }: { searchParams: Promise<{ vista?: string; nicho?: string }> }) {
  const admin = await platformAdminUser();
  if (!admin) notFound();
  const { t } = await getT();
  const params = await searchParams;
  const vista = VIEWS.includes(params.vista ?? "") ? params.vista! : "resumen";

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Foliocrew"
        title={t("Centro de mando", "Command center")}
        description={t(
          "Cómo va Foliocrew y qué está funcionando: cuentas, creadores, contenido, horarios, nichos y los departamentos del equipo. Solo quien administra la plataforma ve esta sección.",
          "How Foliocrew is doing and what's working: accounts, creators, content, timing, niches and the team departments. Only platform admins see this section."
        )}
      />
      <PlatformTabs active={vista} />
      {vista === "resumen" && <ResumenView />}
      {vista === "creadores" && <CreadoresView />}
      {vista === "contenido" && <ContenidoView niche={params.nicho} />}
      {vista === "nichos" && <NichosView />}
      {vista === "inteligencia" && <IntelligenceSection />}
      {vista === "cuentas" && <CuentasView adminCreatorId={admin.creatorId} />}
      {vista === "departamentos" && <DepartmentsSection />}
    </div>
  );
}

// ─── Resumen ───

async function ResumenView() {
  const { t, lang } = await getT();
  const w = (word: string) => reportWord(lang, word);
  const [accounts, waitlist, aiTokens, pending, collected, weeks, leaderboard, content] = await Promise.all([
    platformAccounts(),
    prismaRoot.waitlistEntry.groupBy({ by: ["status"], _count: { _all: true } }),
    prismaRoot.aiUsage.aggregate({
      where: { createdAt: { gte: startOfMonth() } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
    }),
    prismaRoot.payment.findMany({
      where: { status: "reported" },
      orderBy: { createdAt: "asc" },
      include: { creator: { select: { id: true, name: true, slug: true } } },
    }),
    prismaRoot.payment.aggregate({
      where: { status: "confirmed", confirmedAt: { gte: startOfMonth() } },
      _sum: { amountCents: true },
    }),
    signupsByWeek(12, lang),
    creatorLeaderboard(),
    contentAnalytics(),
  ]);
  const states = accounts.map((a) => billingState(a).state);
  const now = Date.now();
  const total = accounts.length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "—");
  const onboarded = accounts.filter((a) => a.onboardedAt).length;
  const verified = accounts.filter((a) => a.owner?.emailVerifiedAt).length;
  const waitlistTotal = waitlist.reduce((sum, row) => sum + row._count._all, 0);
  const waitlistJoined = waitlist.find((row) => row.status === "joined")?._count._all ?? 0;
  const tokens = (aiTokens._sum.inputTokens ?? 0) + (aiTokens._sum.outputTokens ?? 0);
  const top = leaderboard.filter((r) => r.medianEr != null && r.measuredPosts >= 3).sort((a, b) => b.medianEr! - a.medianEr!).slice(0, 3);

  const kpis: [string, string | number, string?][] = [
    [t("Cuentas", "Accounts"), total],
    [t("Nuevas (7 días)", "New (7 days)"), accounts.filter((a) => now - a.createdAt.getTime() < 7 * DAY).length],
    [t("Entraron (7 días)", "Signed in (7 days)"), accounts.filter((a) => a.owner?.lastLoginAt && now - a.owner.lastLoginAt.getTime() < 7 * DAY).length],
    [t("Terminaron el asistente", "Finished onboarding"), onboarded, pct(onboarded)],
    [t("Correo confirmado", "Email confirmed"), verified, pct(verified)],
    [t("Pausadas", "Paused"), accounts.filter((a) => a.status !== "active").length],
    [t("Lista de espera → cuenta", "Waitlist → account"), `${waitlistJoined}/${waitlistTotal}`],
    [t("Sugerencias de IA (mes)", "AI suggestions (month)"), aiTokens._count._all, tokens ? `${Math.round(tokens / 1000)}k tokens` : undefined],
    [t("Pagan", "Paying"), states.filter((s) => s === "active").length],
    [t("En prueba", "On trial"), states.filter((s) => s === "trial").length],
    [t("Vencidas", "Expired"), states.filter((s) => s === "expired" || s === "none").length],
    [
      t("Cobrado este mes", "Collected this month"),
      formatMoney(collected._sum.amountCents ?? 0),
      pending.length ? t(`${pending.length} por confirmar`, `${pending.length} to confirm`) : undefined,
    ],
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {kpis.map(([label, value, sub]) => (
          <Stat key={label} value={value} label={label} sub={sub} />
        ))}
      </div>
      <PendingPayments
        payments={pending.map((p) => ({
          id: p.id,
          creatorId: p.creator.id,
          creatorName: p.creator.name,
          plan: getPlan(p.plan).name,
          months: p.months,
          amount: formatMoney(p.amountCents, p.currency),
          method: paymentMethodLabel(p.method, lang),
          reference: p.reference,
          note: p.note,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
      <div className="grid gap-sp-4 xl:grid-cols-2">
        <Card>
          <p className={`${eyebrowClass} mb-sp-4`}>{t("Cuentas nuevas por semana", "New accounts per week")}</p>
          <WeeklyBars data={weeks} unit={t("cuentas nuevas", "new accounts")} />
        </Card>
        <Card>
          <p className={`${eyebrowClass} mb-sp-3`}>{t("Lo más destacado", "Highlights")}</p>
          <ul className="flex flex-col gap-sp-3 text-sm text-ink">
            <li>
              <strong>{content.total}</strong> {t("publicaciones medidas de", "measured posts from")} <strong>{content.creators}</strong>{" "}
              {t("cuentas · engagement mediano", "accounts · median engagement")} <strong>{content.medianEr ?? "—"}%</strong> ·{" "}
              {t("vistas medianas", "median views")} <strong>{compact(content.medianViews)}</strong>
            </li>
            <li>
              {t("Mejor franja de la plataforma:", "Best time slot on the platform:")}{" "}
              {content.best ? (
                <strong>
                  {w(content.best.day)}, {w(content.best.slot).toLowerCase()} ({content.best.median}%)
                </strong>
              ) : (
                <span className="text-ink/55">{t("faltan publicaciones con fecha", "not enough dated posts")}</span>
              )}
            </li>
            <li>
              {t("Red con mejor engagement:", "Network with best engagement:")}{" "}
              {content.byPlatform[0] ? <strong>{networkLabel(content.byPlatform[0].key)} ({content.byPlatform[0].medianEr}%)</strong> : <span className="text-ink/55">—</span>}
            </li>
            <li>
              <span className="block">{t("Creadores con mejor engagement (mínimo 3 piezas medidas):", "Creators with the best engagement (at least 3 measured pieces):")}</span>
              {top.length ? (
                <ol className="mt-1 list-decimal pl-sp-4">
                  {top.map((r) => (
                    <li key={r.id}>
                      <Link href={`/admin/plataforma/${r.id}`} className="font-semibold hover:text-coral">
                        {r.name}
                      </Link>{" "}
                      · {r.medianEr}% · {r.niche}
                    </li>
                  ))}
                </ol>
              ) : (
                <span className="text-ink/55">{t("todavía nadie tiene 3 piezas con métricas", "nobody has 3 pieces with metrics yet")}</span>
              )}
            </li>
          </ul>
          <div className="mt-sp-4 flex flex-wrap gap-sp-3 text-sm font-semibold">
            <Link href="/admin/plataforma?vista=creadores" className="text-coral hover:underline">
              {t("Ver ranking →", "See ranking →")}
            </Link>
            <Link href="/admin/plataforma?vista=contenido" className="text-coral hover:underline">
              {t("Ver contenido →", "See content →")}
            </Link>
            <Link href="/admin/plataforma?vista=inteligencia" className="text-coral hover:underline">
              {t("Ver inteligencia →", "See intelligence →")}
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}

// ─── Creadores ───

async function CreadoresView() {
  const rows = await creatorLeaderboard();
  return <LeaderboardTable rows={rows} />;
}

// ─── Contenido ───

async function ContenidoView({ niche }: { niche?: string }) {
  const { t, lang } = await getT();
  const w = (word: string) => reportWord(lang, word);
  const valid = NICHES.some((n) => n.id === niche) ? niche : undefined;
  const data = await contentAnalytics(valid);
  const detail = (g: { posts: number; medianViews: number; creators: number }) =>
    t(
      `${g.posts} piezas · ${g.creators} cuentas · ${compact(g.medianViews)} vistas med.`,
      `${g.posts} pieces · ${g.creators} accounts · ${compact(g.medianViews)} median views`
    );

  return (
    <>
      <div className="flex flex-wrap items-center gap-sp-2 text-xs">
        <span className="text-ink/55">{t("Nicho:", "Niche:")}</span>
        <Link
          href="/admin/plataforma?vista=contenido"
          className={`rounded-full px-sp-3 py-1 font-semibold ${!valid ? "bg-ink text-cream" : "border border-line text-ink/70 hover:border-coral"}`}
        >
          {t("Todos", "All")}
        </Link>
        {NICHES.map((n) => (
          <Link
            key={n.id}
            href={`/admin/plataforma?vista=contenido&nicho=${n.id}`}
            className={`rounded-full px-sp-3 py-1 font-semibold ${valid === n.id ? "bg-ink text-cream" : "border border-line text-ink/70 hover:border-coral"}`}
          >
            {n.id === "otro" ? t("Otros / varios", "Other / mixed") : pickLabel(lang, n)}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat value={data.total} label={t("Publicaciones medidas", "Measured posts")} sub={t(`con ${MIN_VIEWS}+ vistas`, `with ${MIN_VIEWS}+ views`)} />
        <Stat value={data.creators} label={t("Cuentas con datos", "Accounts with data")} />
        <Stat value={data.medianEr == null ? "—" : `${data.medianEr}%`} label={t("Engagement mediano", "Median engagement")} />
        <Stat value={compact(data.medianViews)} label={t("Vistas medianas", "Median views")} />
      </div>
      <div className="grid gap-sp-4 xl:grid-cols-2">
        <Card>
          <p className={`${eyebrowClass} mb-sp-1`}>{t("Cuándo publicar (engagement mediano)", "When to post (median engagement)")}</p>
          <p className="mb-sp-4 text-sm text-ink/65">
            {data.best ? (
              <>
                {t("Mejor franja:", "Best slot:")}{" "}
                <strong className="text-ink">
                  {w(data.best.day)}, {w(data.best.slot).toLowerCase()}
                </strong>{" "}
                ({t(`${data.best.median}% con ${data.best.count} piezas`, `${data.best.median}% across ${data.best.count} pieces`)})
              </>
            ) : (
              t("Hace falta que las publicaciones tengan fecha (se carga al sincronizar métricas).", "Posts need a date (it loads when metrics sync).")
            )}
          </p>
          <EngagementHeatmap grid={data.heatmap} />
        </Card>
        <Card>
          <p className={`${eyebrowClass} mb-sp-3`}>{t("Qué funciona mejor", "What works best")}</p>
          <p className="mb-sp-2 text-xs font-semibold text-ink/60">{t("Por red", "By network")}</p>
          <BarList rows={data.byPlatform.map((g) => ({ key: g.key, label: networkLabel(g.key), value: g.medianEr, detail: detail(g) }))} />
          <p className="mb-sp-2 mt-sp-4 text-xs font-semibold text-ink/60">{t("Por formato", "By format")}</p>
          <BarList rows={data.byType.map((g) => ({ key: g.key, label: w(g.key), value: g.medianEr, detail: detail(g) }))} />
          <p className="mb-sp-2 mt-sp-4 text-xs font-semibold text-ink/60">{t("Con marca u orgánico", "Brand or organic")}</p>
          <BarList rows={data.byCollab.map((g) => ({ key: g.key, label: w(g.key), value: g.medianEr, detail: detail(g) }))} />
        </Card>
      </div>
      <Card>
        <p className={`${eyebrowClass} mb-sp-3`}>{t("Las publicaciones con mejor engagement", "Top posts by engagement")}</p>
        {data.top.length === 0 ? (
          <p className="text-sm text-ink/55">{t(`Todavía no hay publicaciones con ${MIN_VIEWS}+ vistas.`, `No posts with ${MIN_VIEWS}+ views yet.`)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-sp-2 pr-sp-3">#</th>
                  <th className="py-sp-2 pr-sp-3">{t("Publicación", "Post")}</th>
                  <th className="py-sp-2 pr-sp-3">{t("Creador/a", "Creator")}</th>
                  <th className="py-sp-2 pr-sp-3">{t("Red · formato", "Network · format")}</th>
                  <th className="py-sp-2 pr-sp-3">{t("Vistas", "Views")}</th>
                  <th className="py-sp-2">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {data.top.map((p, i) => (
                  <tr key={p.id} className="border-t border-line align-top">
                    <td className="py-sp-2 pr-sp-3 font-mono text-ink/45">{i + 1}</td>
                    <td className="max-w-[360px] py-sp-2 pr-sp-3">
                      {p.postUrl ? (
                        <a href={p.postUrl} target="_blank" rel="noreferrer" className="line-clamp-2 text-ink hover:text-coral">
                          {p.caption}
                        </a>
                      ) : (
                        <span className="line-clamp-2">{p.caption}</span>
                      )}
                      <span className="text-xs text-ink/50">
                        {p.category}
                        {p.brandId ? t(" · con marca", " · with brand") : ""}
                      </span>
                    </td>
                    <td className="py-sp-2 pr-sp-3">
                      <Link href={`/admin/plataforma/${p.creatorId}`} className="hover:text-coral">
                        {p.creator.name}
                      </Link>
                      <span className="block text-xs text-ink/50">{pickLabel(lang, p.niche)}</span>
                    </td>
                    <td className="py-sp-2 pr-sp-3 text-ink/70">
                      {networkLabel(p.platform)} · {p.type === "photo" ? t("foto", "photo") : "video"}
                    </td>
                    <td className="py-sp-2 pr-sp-3 font-mono">{compact(p.views)}</td>
                    <td className="py-sp-2 font-mono font-semibold">{p.er}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

// ─── Nichos ───

async function NichosView() {
  const { t, lang } = await getT();
  const rows = await nicheBenchmarks();
  return (
    <Card>
      <p className={`${eyebrowClass} mb-sp-1`}>{t("Comparativa por nicho", "Niche comparison")}</p>
      <p className="mb-sp-4 text-sm text-ink/65">
        {t(
          "Engagement y vistas medianas de cada nicho, la red y el formato que mejor funcionan, y cuánto se cobra a las marcas (según los CRM).",
          "Median engagement and views per niche, the best network and format, and how much brands are charged (from the CRMs)."
        )}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
            <tr>
              <th className="py-sp-2 pr-sp-3">{t("Nicho", "Niche")}</th>
              <th className="py-sp-2 pr-sp-3">{t("Cuentas", "Accounts")}</th>
              <th className="py-sp-2 pr-sp-3">{t("Piezas medidas", "Measured pieces")}</th>
              <th className="py-sp-2 pr-sp-3">{t("Engagement med.", "Median engagement")}</th>
              <th className="py-sp-2 pr-sp-3">{t("Vistas med.", "Median views")}</th>
              <th className="py-sp-2 pr-sp-3">{t("Mejor red", "Best network")}</th>
              <th className="py-sp-2 pr-sp-3">{t("Mejor formato", "Best format")}</th>
              <th className="py-sp-2">{t("Precio por trato (mediana · máx.)", "Price per deal (median · max)")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-sp-2 pr-sp-3">
                  <Link href={`/admin/plataforma?vista=contenido&nicho=${r.id}`} className="font-semibold text-ink hover:text-coral">
                    {pickLabel(lang, r)}
                  </Link>
                </td>
                <td className="py-sp-2 pr-sp-3 font-mono">{r.creators}</td>
                <td className="py-sp-2 pr-sp-3 font-mono">{r.posts}</td>
                <td className="py-sp-2 pr-sp-3 font-mono font-semibold">{r.medianEr == null ? "—" : `${r.medianEr}%`}</td>
                <td className="py-sp-2 pr-sp-3 font-mono">{compact(r.medianViews)}</td>
                <td className="py-sp-2 pr-sp-3">{r.bestPlatform ? networkLabel(r.bestPlatform) : "—"}</td>
                <td className="py-sp-2 pr-sp-3">{r.bestType ? reportWord(lang, r.bestType) : "—"}</td>
                <td className="py-sp-2 font-mono">
                  {r.medianDeal == null ? "—" : `US$${r.medianDeal} · US$${r.maxDeal}`}
                  {r.deals ? <span className="block text-[11px] text-ink/50">{t(`${r.deals} tratos`, `${r.deals} deals`)}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Cuentas (administración) ───

async function CuentasView({ adminCreatorId }: { adminCreatorId: string }) {
  const { t, lang } = await getT();
  const accounts = await platformAccounts();
  const rows = await Promise.all(
    accounts.map(async (a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      siteUrl: await creatorSiteUrl(a),
      email: a.owner?.email ?? "—",
      verified: Boolean(a.owner?.emailVerifiedAt),
      createdAt: a.createdAt.toISOString(),
      lastLoginAt: a.owner?.lastLoginAt?.toISOString() ?? null,
      onboarded: Boolean(a.onboardedAt),
      content: a._count.contentCards,
      brands: a._count.brands,
      messages: a._count.contactMessages,
      networks: a.networks,
      aiThisMonth: a.aiThisMonth,
      status: a.status,
      hasNote: Boolean(a.adminNote),
      plan: a.comp ? t("Cortesía", "Complimentary") : getPlan(a.plan).name,
      billing: billingLabel(billingState(a).state, lang),
      billingState: billingState(a).state,
      billingUntil: billingState(a).until?.toISOString() ?? null,
      isMine: a.id === adminCreatorId,
    }))
  );
  return <AccountsTable rows={rows} />;
}
