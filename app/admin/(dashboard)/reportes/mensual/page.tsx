import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { appTimeZone, todayKey } from "@/lib/growth-server";
import { zonedToUtc } from "@/lib/content-plan";
import { formatMoney, formatShortDate, PAYMENT_STATUS_META, DEAL_STATUS_META, isDealStatus, isPaymentStatus } from "@/lib/crm";
import { engagementRate, formatCompact } from "@/lib/metrics";
import { formatDateKey, goalPercent } from "@/lib/growth";
import { followerGrowth, shiftMonth, monthLabel } from "@/lib/reports";
import { resolveGoalValues } from "@/lib/growth-server";
import PrintButton from "./PrintButton";
import { dateLocale, pickLabel } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-line pt-sp-4">
      <h2 className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{title}</h2>
      {children}
    </section>
  );
}

export default async function MonthlyReportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { t, lang } = await getT();
  const { month: param } = await searchParams;
  const tz = appTimeZone();
  const month = param && /^\d{4}-\d{2}$/.test(param) ? param : todayKey().slice(0, 7);
  const start = zonedToUtc(`${month}-01`, "00:00", tz);
  const end = zonedToUtc(`${shiftMonth(month, 1)}-01`, "00:00", tz);
  const [year, m] = month.split("-").map(Number);

  const [hero, growth, cards, published, deals, goals, milestones] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, niche: true } }),
    followerGrowth(6, month),
    prisma.contentCard.findMany({
      where: { OR: [{ postedAt: { gte: start, lt: end } }, { postedAt: null, createdAt: { gte: start, lt: end } }] },
      include: { brand: { select: { name: true } } },
    }),
    prisma.scheduledPost.findMany({
      where: { publishedAt: { gte: start, lt: end } },
      orderBy: { publishedAt: "asc" },
      include: { brand: { select: { name: true } } },
    }),
    prisma.brand.findMany({
      where: { dealStatus: { not: null }, OR: [{ updatedAt: { gte: start } }, { dealStatus: { in: ["active", "negotiating"] } }] },
      select: { name: true, dealStatus: true, dealValue: true, paymentStatus: true },
      orderBy: { dealValue: "desc" },
    }),
    prisma.goal.findMany({ where: { archived: false }, orderBy: { order: "asc" } }),
    prisma.logEntry.findMany({ where: { kind: "milestone", date: { startsWith: month } }, orderBy: { date: "asc" } }),
  ]);

  const resolvedGoals = await resolveGoalValues(goals);
  const topCards = [...cards].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);
  const monthPoint = growth.series.find((s) => s.month === month);
  const prevPoint = growth.series.find((s) => s.month === shiftMonth(month, -1));
  const monthGrowth = monthPoint?.total != null && prevPoint?.total != null ? monthPoint.total - prevPoint.total : null;
  const totalViews = cards.reduce((sum, c) => sum + (c.views ?? 0), 0);
  const paid = deals.filter((d) => d.paymentStatus === "paid").reduce((sum, d) => sum + (d.dealValue ?? 0), 0);

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-sp-5 flex flex-wrap items-center justify-between gap-sp-3 print:hidden">
        <Link href="/admin/reportes" className="text-sm text-coral hover:underline">
          {t("← Volver a Reportes", "← Back to Reports")}
        </Link>
        <PrintButton />
      </div>

      <article className="flex flex-col gap-sp-5 rounded-[18px] border border-line bg-white p-sp-6 print:border-0 print:p-0">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Reporte mensual", "Monthly report")}</p>
          <h1 className="mt-sp-1 font-fraunces text-4xl font-medium italic text-ink">
            {(lang === "en" ? MONTH_NAMES_EN : MONTH_NAMES)[m - 1]} {year}
          </h1>
          <p className="mt-sp-1 text-sm text-ink/65">
            {hero?.name} · {hero?.niche}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
          {[
            { label: t("Seguidores", "Followers"), value: monthPoint?.total != null ? formatCompact(monthPoint.total) : "—" },
            {
              label: t("Crecimiento del mes", "Monthly growth"),
              value: monthGrowth == null ? "—" : `${monthGrowth >= 0 ? "+" : ""}${formatCompact(Math.abs(monthGrowth))}`,
            },
            { label: t("Vistas del mes", "Views this month"), value: totalViews ? formatCompact(totalViews) : "—" },
            { label: t("Cobrado", "Paid"), value: formatMoney(paid) },
          ].map((k) => (
            <div key={k.label} className="rounded-[12px] bg-cream p-sp-3">
              <p className="font-fraunces text-2xl font-semibold text-ink">{k.value}</p>
              <p className="text-[11px] text-ink/60">{k.label}</p>
            </div>
          ))}
        </div>

        <Section title={t("Seguidores (6 meses)", "Followers (6 months)")}>
          <table className="w-full text-left text-sm">
            <tbody>
              {growth.series.map((s) => (
                <tr key={s.month} className="border-b border-line last:border-0">
                  <td className="py-1.5 text-ink/70">{monthLabel(s.month, lang)}</td>
                  <td className="py-1.5 text-right font-semibold text-ink">{s.total == null ? "—" : s.total.toLocaleString(dateLocale(lang))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title={t("Contenido con mejor alcance", "Top-reach content")}>
          {topCards.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Sin publicaciones registradas este mes.", "No posts recorded this month.")}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase text-ink/50">
                <tr>
                  <th className="pb-1 font-medium">{t("Publicación", "Post")}</th>
                  <th className="pb-1 text-right font-medium">{t("Vistas", "Views")}</th>
                  <th className="pb-1 text-right font-medium">Likes</th>
                  <th className="pb-1 text-right font-medium">Engag.</th>
                </tr>
              </thead>
              <tbody>
                {topCards.map((c) => {
                  const rate = engagementRate(c);
                  return (
                    <tr key={c.id} className="border-t border-line">
                      <td className="py-1.5 pr-sp-2 text-ink">
                        {(lang === "en" && c.captionEn) || c.caption}
                        {c.brand && <span className="text-ink/55"> · {c.brand.name}</span>}
                      </td>
                      <td className="py-1.5 text-right">{formatCompact(c.views)}</td>
                      <td className="py-1.5 text-right">{formatCompact(c.likes)}</td>
                      <td className="py-1.5 text-right">{rate == null ? "—" : `${rate}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section title={t(`Publicado este mes (${published.length})`, `Published this month (${published.length})`)}>
          {published.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Nada marcado como publicado en el Calendario.", "Nothing marked as published in the Calendar.")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {published.map((p) => (
                <li key={p.id} className="flex justify-between gap-sp-3">
                  <span className="text-ink">
                    {p.caption.split("\n")[0] || t("(sin texto)", "(no text)")}
                    {p.brand && <span className="text-ink/55"> · {p.brand.name}</span>}
                  </span>
                  <span className="shrink-0 text-ink/55">{formatShortDate(p.publishedAt, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("Marcas y tratos", "Brands & deals")}>
          {deals.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Sin tratos registrados.", "No deals recorded.")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {deals.map((d) => (
                <li key={d.name} className="flex justify-between gap-sp-3">
                  <span className="text-ink">
                    {d.name}
                    <span className="text-ink/55"> · {isDealStatus(d.dealStatus) ? pickLabel(lang, DEAL_STATUS_META[d.dealStatus]) : ""}</span>
                  </span>
                  <span className="shrink-0 text-ink/70">
                    {formatMoney(d.dealValue)}
                    {isPaymentStatus(d.paymentStatus) && ` · ${pickLabel(lang, PAYMENT_STATUS_META[d.paymentStatus])}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {(goals.length > 0 || milestones.length > 0) && (
          <Section title={t("Metas e hitos", "Goals & milestones")}>
            <ul className="flex flex-col gap-1 text-sm">
              {resolvedGoals.map((g) => (
                <li key={g.id} className="flex justify-between gap-sp-3">
                  <span className="text-ink">{g.title}</span>
                  <span className="text-ink/70">{goalPercent(g.current, g.target)}%</span>
                </li>
              ))}
              {milestones.map((ms) => (
                <li key={ms.id} className="text-ink">
                  ★ {ms.title} <span className="text-ink/55">· {formatDateKey(ms.date, true, lang)}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <p className="text-[10px] text-ink/40">
          {t("Generado el", "Generated on")} {formatDateKey(todayKey(), true, lang)}.
        </p>
      </article>
    </div>
  );
}
