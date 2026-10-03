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
import { BarList, EngagementHeatmap, PlatformTabs, Stat, WeeklyBars, compact, eyebrowClass } from "./charts";
import { BILLING_LABEL, PAYMENT_METHODS, billingState, formatMoney, getPlan, type PaymentMethod } from "@/lib/billing";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const VIEWS = ["resumen", "creadores", "contenido", "nichos", "inteligencia", "cuentas"];
const networkLabel = (key: string) => (key in NETWORK_META ? NETWORK_META[key as keyof typeof NETWORK_META].label : key);

export default async function PlatformPage({ searchParams }: { searchParams: Promise<{ vista?: string; nicho?: string }> }) {
  const admin = await platformAdminUser();
  if (!admin) notFound();
  const params = await searchParams;
  const vista = VIEWS.includes(params.vista ?? "") ? params.vista! : "resumen";

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Foliocrew"
        title="Centro de mando"
        description="Cómo va Foliocrew y qué está funcionando: cuentas, creadores, contenido, horarios y nichos. Solo quien administra la plataforma ve esta sección."
      />
      <PlatformTabs active={vista} />
      {vista === "resumen" && <ResumenView />}
      {vista === "creadores" && <CreadoresView />}
      {vista === "contenido" && <ContenidoView niche={params.nicho} />}
      {vista === "nichos" && <NichosView />}
      {vista === "inteligencia" && <IntelligenceSection />}
      {vista === "cuentas" && <CuentasView adminCreatorId={admin.creatorId} />}
    </div>
  );
}

// ─── Resumen ───

async function ResumenView() {
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
    signupsByWeek(12),
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
    ["Cuentas", total],
    ["Nuevas (7 días)", accounts.filter((a) => now - a.createdAt.getTime() < 7 * DAY).length],
    ["Entraron (7 días)", accounts.filter((a) => a.owner?.lastLoginAt && now - a.owner.lastLoginAt.getTime() < 7 * DAY).length],
    ["Terminaron el asistente", onboarded, pct(onboarded)],
    ["Correo confirmado", verified, pct(verified)],
    ["Pausadas", accounts.filter((a) => a.status !== "active").length],
    ["Lista de espera → cuenta", `${waitlistJoined}/${waitlistTotal}`],
    ["Sugerencias de IA (mes)", aiTokens._count._all, tokens ? `${Math.round(tokens / 1000)}k tokens` : undefined],
    ["Pagan", states.filter((s) => s === "active").length],
    ["En prueba", states.filter((s) => s === "trial").length],
    ["Vencidas", states.filter((s) => s === "expired" || s === "none").length],
    ["Cobrado este mes", formatMoney(collected._sum.amountCents ?? 0), pending.length ? `${pending.length} por confirmar` : undefined],
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
          method: PAYMENT_METHODS[p.method as PaymentMethod] ?? p.method,
          reference: p.reference,
          note: p.note,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
      <div className="grid gap-sp-4 xl:grid-cols-2">
        <Card>
          <p className={`${eyebrowClass} mb-sp-4`}>Cuentas nuevas por semana</p>
          <WeeklyBars data={weeks} unit="cuentas nuevas" />
        </Card>
        <Card>
          <p className={`${eyebrowClass} mb-sp-3`}>Lo más destacado</p>
          <ul className="flex flex-col gap-sp-3 text-sm text-ink">
            <li>
              <strong>{content.total}</strong> publicaciones medidas de <strong>{content.creators}</strong> cuentas · engagement mediano{" "}
              <strong>{content.medianEr ?? "—"}%</strong> · vistas medianas <strong>{compact(content.medianViews)}</strong>
            </li>
            <li>
              Mejor franja de la plataforma:{" "}
              {content.best ? (
                <strong>
                  {content.best.day}, {content.best.slot.toLowerCase()} ({content.best.median}%)
                </strong>
              ) : (
                <span className="text-ink/55">faltan publicaciones con fecha</span>
              )}
            </li>
            <li>
              Red con mejor engagement:{" "}
              {content.byPlatform[0] ? <strong>{networkLabel(content.byPlatform[0].key)} ({content.byPlatform[0].medianEr}%)</strong> : <span className="text-ink/55">—</span>}
            </li>
            <li>
              <span className="block">Creadores con mejor engagement (mínimo 3 piezas medidas):</span>
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
                <span className="text-ink/55">todavía nadie tiene 3 piezas con métricas</span>
              )}
            </li>
          </ul>
          <div className="mt-sp-4 flex flex-wrap gap-sp-3 text-sm font-semibold">
            <Link href="/admin/plataforma?vista=creadores" className="text-coral hover:underline">
              Ver ranking →
            </Link>
            <Link href="/admin/plataforma?vista=contenido" className="text-coral hover:underline">
              Ver contenido →
            </Link>
            <Link href="/admin/plataforma?vista=inteligencia" className="text-coral hover:underline">
              Ver inteligencia →
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
  const valid = NICHES.some((n) => n.id === niche) ? niche : undefined;
  const data = await contentAnalytics(valid);
  const detail = (g: { posts: number; medianViews: number; creators: number }) =>
    `${g.posts} piezas · ${g.creators} cuentas · ${compact(g.medianViews)} vistas med.`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-sp-2 text-xs">
        <span className="text-ink/55">Nicho:</span>
        <Link
          href="/admin/plataforma?vista=contenido"
          className={`rounded-full px-sp-3 py-1 font-semibold ${!valid ? "bg-ink text-cream" : "border border-line text-ink/70 hover:border-coral"}`}
        >
          Todos
        </Link>
        {NICHES.map((n) => (
          <Link
            key={n.id}
            href={`/admin/plataforma?vista=contenido&nicho=${n.id}`}
            className={`rounded-full px-sp-3 py-1 font-semibold ${valid === n.id ? "bg-ink text-cream" : "border border-line text-ink/70 hover:border-coral"}`}
          >
            {n.id === "otro" ? "Otros / varios" : n.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat value={data.total} label="Publicaciones medidas" sub={`con ${MIN_VIEWS}+ vistas`} />
        <Stat value={data.creators} label="Cuentas con datos" />
        <Stat value={data.medianEr == null ? "—" : `${data.medianEr}%`} label="Engagement mediano" />
        <Stat value={compact(data.medianViews)} label="Vistas medianas" />
      </div>
      <div className="grid gap-sp-4 xl:grid-cols-2">
        <Card>
          <p className={`${eyebrowClass} mb-sp-1`}>Cuándo publicar (engagement mediano)</p>
          <p className="mb-sp-4 text-sm text-ink/65">
            {data.best ? (
              <>
                Mejor franja: <strong className="text-ink">{data.best.day}, {data.best.slot.toLowerCase()}</strong> ({data.best.median}% con{" "}
                {data.best.count} piezas)
              </>
            ) : (
              "Hace falta que las publicaciones tengan fecha (se carga al sincronizar métricas)."
            )}
          </p>
          <EngagementHeatmap grid={data.heatmap} />
        </Card>
        <Card>
          <p className={`${eyebrowClass} mb-sp-3`}>Qué funciona mejor</p>
          <p className="mb-sp-2 text-xs font-semibold text-ink/60">Por red</p>
          <BarList rows={data.byPlatform.map((g) => ({ key: g.key, label: networkLabel(g.key), value: g.medianEr, detail: detail(g) }))} />
          <p className="mb-sp-2 mt-sp-4 text-xs font-semibold text-ink/60">Por formato</p>
          <BarList rows={data.byType.map((g) => ({ key: g.key, label: g.key, value: g.medianEr, detail: detail(g) }))} />
          <p className="mb-sp-2 mt-sp-4 text-xs font-semibold text-ink/60">Con marca u orgánico</p>
          <BarList rows={data.byCollab.map((g) => ({ key: g.key, label: g.key, value: g.medianEr, detail: detail(g) }))} />
        </Card>
      </div>
      <Card>
        <p className={`${eyebrowClass} mb-sp-3`}>Las publicaciones con mejor engagement</p>
        {data.top.length === 0 ? (
          <p className="text-sm text-ink/55">Todavía no hay publicaciones con {MIN_VIEWS}+ vistas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-sp-2 pr-sp-3">#</th>
                  <th className="py-sp-2 pr-sp-3">Publicación</th>
                  <th className="py-sp-2 pr-sp-3">Creador/a</th>
                  <th className="py-sp-2 pr-sp-3">Red · formato</th>
                  <th className="py-sp-2 pr-sp-3">Vistas</th>
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
                        {p.brandId ? " · con marca" : ""}
                      </span>
                    </td>
                    <td className="py-sp-2 pr-sp-3">
                      <Link href={`/admin/plataforma/${p.creatorId}`} className="hover:text-coral">
                        {p.creator.name}
                      </Link>
                      <span className="block text-xs text-ink/50">{p.niche.label}</span>
                    </td>
                    <td className="py-sp-2 pr-sp-3 text-ink/70">
                      {networkLabel(p.platform)} · {p.type === "photo" ? "foto" : "video"}
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
  const rows = await nicheBenchmarks();
  return (
    <Card>
      <p className={`${eyebrowClass} mb-sp-1`}>Comparativa por nicho</p>
      <p className="mb-sp-4 text-sm text-ink/65">
        Engagement y vistas medianas de cada nicho, la red y el formato que mejor funcionan, y cuánto se cobra a las marcas (según los CRM).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
            <tr>
              <th className="py-sp-2 pr-sp-3">Nicho</th>
              <th className="py-sp-2 pr-sp-3">Cuentas</th>
              <th className="py-sp-2 pr-sp-3">Piezas medidas</th>
              <th className="py-sp-2 pr-sp-3">Engagement med.</th>
              <th className="py-sp-2 pr-sp-3">Vistas med.</th>
              <th className="py-sp-2 pr-sp-3">Mejor red</th>
              <th className="py-sp-2 pr-sp-3">Mejor formato</th>
              <th className="py-sp-2">Precio por trato (mediana · máx.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-sp-2 pr-sp-3">
                  <Link href={`/admin/plataforma?vista=contenido&nicho=${r.id}`} className="font-semibold text-ink hover:text-coral">
                    {r.label}
                  </Link>
                </td>
                <td className="py-sp-2 pr-sp-3 font-mono">{r.creators}</td>
                <td className="py-sp-2 pr-sp-3 font-mono">{r.posts}</td>
                <td className="py-sp-2 pr-sp-3 font-mono font-semibold">{r.medianEr == null ? "—" : `${r.medianEr}%`}</td>
                <td className="py-sp-2 pr-sp-3 font-mono">{compact(r.medianViews)}</td>
                <td className="py-sp-2 pr-sp-3">{r.bestPlatform ? networkLabel(r.bestPlatform) : "—"}</td>
                <td className="py-sp-2 pr-sp-3">{r.bestType ?? "—"}</td>
                <td className="py-sp-2 font-mono">
                  {r.medianDeal == null ? "—" : `US$${r.medianDeal} · US$${r.maxDeal}`}
                  {r.deals ? <span className="block text-[11px] text-ink/50">{r.deals} tratos</span> : null}
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
      plan: a.comp ? "Cortesía" : getPlan(a.plan).name,
      billing: BILLING_LABEL[billingState(a).state],
      billingState: billingState(a).state,
      billingUntil: billingState(a).until?.toISOString() ?? null,
      isMine: a.id === adminCreatorId,
    }))
  );
  return <AccountsTable rows={rows} />;
}
