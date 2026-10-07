import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { todayKey } from "@/lib/growth-server";
import { formatDateKey } from "@/lib/growth";
import { workload } from "@/lib/wellbeing";
import { getLoadLimit, pendingDeliverableDates } from "@/lib/wellbeing-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import WellbeingManager from "./WellbeingManager";

export const dynamic = "force-dynamic";

/** Bienestar (E3): carga de trabajo, modo descanso y banco de contenido para las semanas flojas. */
export default async function WellbeingPage() {
  const { t, lang } = await getT();
  const today = todayKey();
  const [limit, dates, bank, periods, hero] = await Promise.all([
    getLoadLimit(),
    pendingDeliverableDates(),
    prisma.contentBankItem.findMany({ orderBy: [{ createdAt: "desc" }], take: 200 }),
    prisma.restPeriod.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.hero.findFirst({ select: { name: true } }),
  ]);
  const load = workload(dates, today, 4, limit);
  const maxWeek = Math.max(1, limit, ...load.weeks.map((w) => w.count));

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Contenido", "Content")}
        title={t("Bienestar", "Wellbeing")}
        description={t(
          "Crear contenido cansa. Aquí cuidas tu ritmo: ves cuándo te llega demasiado trabajo, te tomas un descanso sin romper el calendario y guardas ideas para las semanas flojas.",
          "Creating content is tiring. Here you look after your pace: see when too much work is coming, take a break without breaking your calendar and keep ideas for slow weeks."
        )}
      />

      <Card className={load.over ? "border-coral/40" : ""}>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tu carga de trabajo (próximas 4 semanas)", "Your workload (next 4 weeks)")}</p>
        {load.over ? (
          <p className="mb-sp-3 text-sm font-semibold text-coral">
            {t(`⚠ Tienes ${load.peak} entregas en 7 días a partir del ${formatDateKey(load.peakStart as string, false, lang)}. Tu límite es ${limit}.`, `⚠ You have ${load.peak} deliverables within 7 days starting ${formatDateKey(load.peakStart as string, false, lang)}. Your limit is ${limit}.`)}
          </p>
        ) : (
          <p className="mb-sp-3 text-sm text-ink/70">{t("Todo dentro de tu límite. ¡Bien!", "All within your limit. Nice!")}</p>
        )}
        <ul className="flex flex-col gap-sp-2">
          {load.weeks.map((w) => (
            <li key={w.start} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-sp-3 text-xs">
              <span className="text-ink/60">{t("Semana del", "Week of")} {formatDateKey(w.start, false, lang)}</span>
              <span className="h-2 rounded-full bg-cream">
                <span className={`block h-2 rounded-full ${w.count > limit ? "bg-coral" : "bg-lime"}`} style={{ width: `${(w.count / maxWeek) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-ink">{w.count}</span>
            </li>
          ))}
        </ul>
        <p className="mt-sp-3 text-[11px] text-ink/50">{t("Cuenta las entregas pendientes de tus tratos que tienen fecha.", "Counts the pending deliverables from your deals that have a date.")}</p>
      </Card>

      <WellbeingManager
        today={today}
        creatorName={hero?.name ?? ""}
        loadLimit={limit}
        periods={periods.map((p) => ({
          id: p.id,
          startDate: p.startDate,
          endDate: p.endDate,
          note: p.note,
          undone: Boolean(p.undoneAt),
          moved: Array.isArray(p.moved) ? p.moved.length : 0,
          brands: (Array.isArray(p.brands) ? p.brands : []) as { brandId: string; brandName: string; email: string | null; titles: string[]; sentAt: string | null }[],
        }))}
        bank={bank.map((b) => ({ id: b.id, title: b.title, caption: b.caption, contentType: b.contentType, networks: b.networks, used: Boolean(b.usedAt) }))}
      />
    </div>
  );
}
