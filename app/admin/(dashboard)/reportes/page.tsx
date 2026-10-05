import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { todayKey } from "@/lib/growth-server";
import { formatMoney } from "@/lib/crm";
import { formatCompact } from "@/lib/metrics";
import { NETWORK_META, isPlanNetwork } from "@/lib/content-plan";
import {
  HEATMAP_DAYS,
  HEATMAP_SLOTS,
  contentStats,
  followerGrowth,
  postingHeatmap,
  revenueByBrand,
  shiftMonth,
  monthLabel,
  reportWord,
} from "@/lib/reports";
import { dateLocale } from "@/lib/admin-lang";
import ReportActions from "./ReportActions";
import InsightsCard from "@/components/admin/InsightsCard";
import { sessionCreatorSite } from "@/lib/site-url";
import { getT } from "@/lib/admin-lang-server";

const eyebrowClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

// Escala secuencial de un solo tono (acento), de claro a oscuro.
const HEAT_STEPS = ["bg-coral/15", "bg-coral/35", "bg-coral/60", "bg-coral/85"];

export default async function AdminReportsPage() {
  const { t, lang } = await getT();
  const today = todayKey();
  const month = today.slice(0, 7);
  const [growth, heatmap, revenue, stats, hero, collabs] = await Promise.all([
    followerGrowth(6),
    postingHeatmap(),
    revenueByBrand(),
    contentStats(month),
    prisma.hero.findFirst({ select: { name: true, niche: true } }),
    prisma.brand.count({ where: { dealStatus: { in: ["active", "completed"] } } }),
  ]);

  const w = (word: string) => reportWord(lang, word);
  const num = (n: number) => n.toLocaleString(dateLocale(lang));
  const maxBar = Math.max(1, ...growth.series.map((s) => s.total ?? 0));
  const heatValues = heatmap.grid.flat().filter((c): c is { avg: number; count: number } => !!c).map((c) => c.avg);
  const heatMax = Math.max(0, ...heatValues);
  const maxRevenue = Math.max(1, ...revenue.rows.map((r) => r.value));

  const kpis = [
    {
      label: t("Seguidores totales", "Total followers"),
      value: growth.totalNow == null ? "—" : formatCompact(growth.totalNow),
      sub:
        growth.delta30 == null
          ? t("Sin historial de 30 días aún", "No 30-day history yet")
          : `${growth.delta30 >= 0 ? "+" : "−"}${formatCompact(Math.abs(growth.delta30))} ${t("en 30 días", "in 30 days")}`,
    },
    {
      label: t("Engagement promedio", "Average engagement"),
      value: stats.avgEngagement == null ? "—" : `${stats.avgEngagement}%`,
      sub: t(`${stats.cardsWithMetrics} publicaciones con métricas`, `${stats.cardsWithMetrics} posts with metrics`),
    },
    {
      label: t("Publicaciones este mes", "Posts this month"),
      value: String(stats.postsThisMonth),
      sub: t("Feed + marcadas como publicadas", "Feed + marked as published"),
    },
    {
      label: t("Ingresos cobrados", "Revenue collected"),
      value: formatMoney(revenue.paid),
      sub: t(`${formatMoney(revenue.pending)} por cobrar`, `${formatMoney(revenue.pending)} to collect`),
    },
  ];

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Reportes", "Reports")}
        description={t("Tu crecimiento, tu mejor momento para publicar y tus ingresos, con datos reales.", "Your growth, your best time to post and your revenue, with real data.")}
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="font-fraunces text-3xl font-semibold text-ink">{kpi.value}</p>
            <p className="mt-sp-1 text-sm font-medium text-ink/75">{kpi.label}</p>
            <p className="mt-0.5 text-xs text-ink/50">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      <InsightsCard />

      <div className="grid gap-sp-4 xl:grid-cols-2">
        <Card>
          <p className={eyebrowClass}>{t("Seguidores totales · últimos 6 meses", "Total followers · last 6 months")}</p>
          {growth.series.every((s) => s.total == null) ? (
            <p className="mt-sp-3 text-sm text-ink/60">
              {t(
                "Aún no hay historial. Se guarda solo cada vez que conectas o pruebas una red, o puedes cargarlo a mano abajo.",
                "No history yet. It's saved automatically each time you connect or test a network, or you can add it by hand below."
              )}
            </p>
          ) : (
            <div className="mt-sp-4 flex h-[190px] items-end gap-sp-3" role="img" aria-label={t("Seguidores totales por mes", "Total followers per month")}>
              {growth.series.map((s) => (
                <div key={s.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${monthLabel(s.month, lang)}: ${s.total == null ? t("sin dato", "no data") : num(s.total)} ${t("seguidores", "followers")}`}>
                  <span className="font-mono text-[11px] font-bold text-ink">{s.total == null ? "—" : formatCompact(s.total)}</span>
                  <div
                    className="w-full max-w-[44px] rounded-t-[4px] bg-coral"
                    style={{ height: s.total == null ? 2 : `${Math.max(4, (s.total / maxBar) * 140)}px`, opacity: s.total == null ? 0.2 : 1 }}
                  />
                  <span className="text-[11px] text-ink/60">{monthLabel(s.month, lang)}</span>
                </div>
              ))}
            </div>
          )}
          {growth.byPlatform.length > 0 && (
            <div className="mt-sp-4 flex flex-wrap gap-sp-3 border-t border-line pt-sp-3 text-xs text-ink/70">
              {growth.byPlatform.map((p) => (
                <span key={p.platform} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isPlanNetwork(p.platform) ? NETWORK_META[p.platform].dot : "bg-ink"}`} />
                  {isPlanNetwork(p.platform) ? NETWORK_META[p.platform].label : p.platform}: <strong>{num(p.followers)}</strong>
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-sp-2">
            <p className={eyebrowClass}>{t("Mejor momento para publicar", "Best time to post")}</p>
            {heatmap.best && (
              <p className="text-xs text-ink/70">
                {t("Tu mejor franja:", "Your best slot:")}{" "}
                <strong className="text-ink">
                  {w(heatmap.best.day)}, {w(heatmap.best.slot).toLowerCase()}
                </strong>{" "}
                ({heatmap.best.avg}% {t("de engagement", "engagement")})
              </p>
            )}
          </div>
          {heatmap.samples < 3 ? (
            <p className="mt-sp-3 text-sm text-ink/60">
              {t(
                `Necesita al menos 3 publicaciones con fecha de publicación, vistas y likes (${heatmap.samples} por ahora). La fecha se carga sola al sincronizar métricas, o a mano en Feed → Métricas.`,
                `Needs at least 3 posts with a publish date, views and likes (${heatmap.samples} so far). The date is filled in when you sync metrics, or by hand in Feed → Metrics.`
              )}
            </p>
          ) : (
            <>
              <div className="mt-sp-4 grid grid-cols-[48px_repeat(4,1fr)] gap-1 text-center">
                <span />
                {HEATMAP_SLOTS.map((slot) => (
                  <span key={slot.label} className="text-[10px] text-ink/60" title={slot.hint}>
                    {w(slot.label)}
                  </span>
                ))}
                {HEATMAP_DAYS.map((day, d) => (
                  <div key={day} className="contents">
                    <span className="self-center text-left text-[11px] text-ink/70">{w(day)}</span>
                    {heatmap.grid[d].map((cell, s) => {
                      const step = cell && heatMax > 0 ? Math.min(3, Math.floor((cell.avg / heatMax) * 3.999)) : -1;
                      return (
                        <span
                          key={s}
                          title={
                            cell
                              ? `${w(day)} ${w(HEATMAP_SLOTS[s].label).toLowerCase()}: ${cell.avg}% (${cell.count} ${cell.count === 1 ? t("publicación", "post") : t("publicaciones", "posts")})`
                              : `${w(day)} ${w(HEATMAP_SLOTS[s].label).toLowerCase()}: ${t("sin datos", "no data")}`
                          }
                          className={`flex h-8 items-center justify-center rounded-[6px] font-mono text-[10px] ${
                            step < 0 ? "bg-cream text-ink/30" : `${HEAT_STEPS[step]} ${step >= 2 ? "text-white" : "text-ink"}`
                          }`}
                        >
                          {cell ? `${cell.avg}%` : "·"}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-sp-3 flex items-center gap-1.5 text-[10px] text-ink/55">
                {t("Menos engagement", "Less engagement")}
                {HEAT_STEPS.map((c) => (
                  <span key={c} className={`h-2.5 w-5 rounded-[3px] ${c}`} />
                ))}
                {t("Más", "More")}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-sp-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <p className={eyebrowClass}>{t("Ingresos por marca", "Revenue by brand")}</p>
          {revenue.rows.length === 0 ? (
            <p className="mt-sp-3 text-sm text-ink/60">{t("Agrega el valor de tus tratos en Marcas para verlos aquí.", "Add the value of your deals in Brands to see them here.")}</p>
          ) : (
            <>
              <ul className="mt-sp-3 flex flex-col gap-2.5">
                {revenue.rows.map((row) => (
                  <li key={row.name} className="grid grid-cols-[110px_1fr_auto] items-center gap-sp-3 sm:grid-cols-[150px_1fr_auto]">
                    <span className="truncate text-[13px] font-semibold text-ink">{row.name}</span>
                    <span className="h-2.5 rounded-full bg-cream">
                      <span className="block h-full rounded-full bg-coral" style={{ width: `${(row.value / maxRevenue) * 100}%` }} />
                    </span>
                    <span className="text-right text-xs text-ink/70">
                      <strong className="text-ink">{formatMoney(row.value)}</strong> · {w(row.state)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-sp-4 grid grid-cols-3 gap-sp-3 border-t border-line pt-sp-3 text-center">
                {[
                  { label: t("Cobrado", "Paid"), value: revenue.paid },
                  { label: t("Por cobrar", "To collect"), value: revenue.pending },
                  { label: t("En negociación", "Negotiating"), value: revenue.negotiating },
                ].map((tile) => (
                  <div key={tile.label}>
                    <p className="font-fraunces text-xl font-semibold text-ink">{formatMoney(tile.value)}</p>
                    <p className="text-[11px] text-ink/55">{tile.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <ReportActions
          siteUrl={(await sessionCreatorSite())?.url ?? ""}
          currentMonth={month}
          months={Array.from({ length: 6 }, (_, i) => {
            const m = shiftMonth(month, -i);
            return { value: m, label: monthLabel(m, lang) };
          })}
          mediaKit={{
            name: hero?.name ?? "",
            niche: hero?.niche ?? "",
            followers: growth.totalNow == null ? "—" : formatCompact(growth.totalNow),
            engagement: stats.avgEngagement == null ? "—" : `${stats.avgEngagement}%`,
            collabs: String(collabs),
          }}
        />
      </div>
    </div>
  );
}
