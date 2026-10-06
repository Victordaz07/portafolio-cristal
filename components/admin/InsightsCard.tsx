import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { engagementRate } from "@/lib/metrics";
import { MIN_VIEWS, median, nicheOf } from "@/lib/platform-analytics";
import { MIN_CREATORS, MIN_POSTS, insightForNiche, playbookIn } from "@/lib/insights";
import Card from "./Card";
import ShareInsightsButton from "./ShareInsightsButton";
import { reportWord } from "@/lib/reports";
import { dateLocale, pickLabel } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

const eyebrowClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";
const PLATFORM_NAMES: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", ugc: "Fotos de portafolio" };
const PLATFORM_NAMES_EN: Record<string, string> = { ...PLATFORM_NAMES, ugc: "Portfolio photos" };

/** "Lo que funciona en tu nicho": comparativa con resultados reales y anónimos de otras cuentas (solo si participas). */
export default async function InsightsCard() {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const [creator, hero] = await Promise.all([
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { shareInsights: true } }),
    prisma.hero.findFirst({ select: { niche: true } }),
  ]);
  const niche = nicheOf(hero?.niche);

  if (!creator?.shareInsights) {
    return (
      <Card>
        <p className={eyebrowClass}>{t("Inteligencia Foliocrew", "Foliocrew Intelligence")}</p>
        <h2 className="mt-sp-2 font-fraunces text-xl font-semibold text-ink">{t("Descubre qué funciona en tu nicho", "Discover what works in your niche")}</h2>
        <p className="mt-sp-2 max-w-2xl text-sm text-ink/70">
          {t(
            `Si te sumas, comparamos tus resultados con los de otras cuentas de ${niche.label}: mejores días y horarios, formatos que más enganchan y lo que conviene evitar. A cambio, tus métricas cuentan (de forma anónima y agregada) para ayudar a los demás.`,
            `If you join, we compare your results with other ${pickLabel(lang, niche)} accounts: best days and times, the formats that engage most and what to avoid. In return, your metrics count (anonymously and in aggregate) to help others.`
          )}
        </p>
        <ul className="mt-sp-3 flex flex-col gap-1 text-xs text-ink/60">
          <li>· {t(`Nadie ve tu nombre, tu usuario ni tus marcas: solo promedios de grupos de ${MIN_CREATORS} cuentas o más.`, `Nobody sees your name, username or brands: only averages from groups of ${MIN_CREATORS}+ accounts.`)}</li>
          <li>· {t("Las sugerencias de IA de tu panel empiezan a usar estos datos reales.", "Your dashboard's AI suggestions start using this real data.")}</li>
          <li>· {t("Puedes salir cuando quieras desde Mi cuenta.", "You can leave anytime from My account.")}</li>
        </ul>
        <div className="mt-sp-4">
          <ShareInsightsButton share label={t("Sumarme", "Join")} />
        </div>
      </Card>
    );
  }

  const [insight, cards] = await Promise.all([
    insightForNiche(hero?.niche),
    prisma.contentCard.findMany({
      where: { views: { gte: MIN_VIEWS } },
      select: { views: true, likes: true, comments: true, shares: true, saves: true },
    }),
  ]);
  const myEr = median(cards.map((c) => engagementRate(c)).filter((v): v is number => v != null));

  if (!insight) {
    return (
      <Card>
        <p className={eyebrowClass}>{t("Inteligencia Foliocrew · participas", "Foliocrew Intelligence · participating")}</p>
        <h2 className="mt-sp-2 font-fraunces text-xl font-semibold text-ink">{t("Estamos juntando datos", "We're gathering data")}</h2>
        <p className="mt-sp-2 max-w-2xl text-sm text-ink/70">
          {t(
            `Para proteger la privacidad de todos, la comparativa aparece cuando haya al menos ${MIN_CREATORS} cuentas participando y ${MIN_POSTS} publicaciones medidas (con ${MIN_VIEWS}+ vistas). Mientras tanto, carga las métricas de tus publicaciones en Contenido.`,
            `To protect everyone's privacy, the comparison appears once at least ${MIN_CREATORS} accounts participate with ${MIN_POSTS} measured posts (${MIN_VIEWS}+ views). Meanwhile, add your post metrics in Content.`
          )}
        </p>
        <p className="mt-sp-2 text-xs text-ink/55">{t(`Tienes ${cards.length} publicaciones medidas.`, `You have ${cards.length} measured posts.`)}</p>
      </Card>
    );
  }

  const s = insight.stats;
  const diff = myEr != null && s.medianEr != null ? Math.round((myEr - s.medianEr) * 10) / 10 : null;
  const updated = insight.generatedAt.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "long" });
  const w = (word: string) => reportWord(lang, word);
  const pb = insight.playbook ? playbookIn(insight.playbook, lang) : null;
  const groupLabel = lang === "en" ? (insight.isOwnNiche ? pickLabel(lang, niche) : "Whole platform") : insight.label;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-sp-3">
        <div>
          <p className={eyebrowClass}>
            {t("Inteligencia Foliocrew", "Foliocrew Intelligence")} · {groupLabel}
          </p>
          <h2 className="mt-sp-2 font-fraunces text-xl font-semibold text-ink">{t("Lo que funciona en tu nicho", "What works in your niche")}</h2>
          <p className="mt-1 text-xs text-ink/55">
            {insight.isOwnNiche
              ? ""
              : t("Tu nicho aún no tiene suficientes cuentas, así que ves el promedio de toda la plataforma. ", "Your niche doesn't have enough accounts yet, so you see the platform-wide average. ")}
            {t(
              `${insight.creators} cuentas · ${insight.posts} publicaciones · actualizado el ${updated}`,
              `${insight.creators} accounts · ${insight.posts} posts · updated ${updated}`
            )}
          </p>
        </div>
      </div>

      <div className="mt-sp-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] bg-cream p-sp-4">
          <p className="font-fraunces text-2xl font-semibold text-ink">{myEr == null ? "—" : `${myEr}%`}</p>
          <p className="text-xs text-ink/60">{t("Tu engagement mediano", "Your median engagement")}</p>
        </div>
        <div className="rounded-[14px] bg-cream p-sp-4">
          <p className="font-fraunces text-2xl font-semibold text-ink">{s.medianEr == null ? "—" : `${s.medianEr}%`}</p>
          <p className="text-xs text-ink/60">{insight.isOwnNiche ? t("Mediana del nicho", "Niche median") : t("Mediana del grupo", "Group median")}</p>
        </div>
        <div className="rounded-[14px] bg-cream p-sp-4">
          <p className="font-fraunces text-2xl font-semibold text-ink">{diff == null ? "—" : `${diff >= 0 ? "+" : "−"}${Math.abs(diff)} pts`}</p>
          <p className="text-xs text-ink/60">
            {diff == null
              ? t("Carga métricas para compararte", "Add metrics to compare yourself")
              : diff >= 0
                ? t("Por encima de la mediana", "Above the median")
                : t("Por debajo de la mediana", "Below the median")}
          </p>
        </div>
      </div>

      <div className="mt-sp-4 grid gap-sp-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-ink">{t("Mejores momentos para publicar", "Best times to post")}</p>
          {s.bestSlots.length ? (
            <ul className="mt-sp-2 flex flex-col gap-1 text-sm text-ink/75">
              {s.bestSlots.map((b) => (
                <li key={`${b.day}-${b.slot}`}>
                  {w(b.day)}, {w(b.slot).toLowerCase()} · <strong className="font-mono">{b.median}%</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-sp-2 text-sm text-ink/55">{t("Aún no hay suficientes publicaciones con fecha.", "There aren't enough dated posts yet.")}</p>
          )}
          {s.worstSlots.length > 0 && (
            <p className="mt-sp-2 text-xs text-ink/55">
              {t("Rinden menos:", "Perform worse:")} {s.worstSlots.map((x) => `${w(x.day)} ${w(x.slot).toLowerCase()}`).join(", ")}.
            </p>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{t("Formatos y redes", "Formats & networks")}</p>
          <ul className="mt-sp-2 flex flex-col gap-1 text-sm text-ink/75">
            {s.byType.length > 1 && (
              <li>
                {t("Formato:", "Format:")} <strong>{w(s.byType[0].key)}</strong> ({s.byType[0].medianEr}%)
              </li>
            )}
            {s.byPlatform.length > 1 && (
              <li>
                {t("Red:", "Network:")} <strong>{(lang === "en" ? PLATFORM_NAMES_EN : PLATFORM_NAMES)[s.byPlatform[0].key] ?? s.byPlatform[0].key}</strong> ({s.byPlatform[0].medianEr}%)
              </li>
            )}
            {s.captionLength.length > 1 && (
              <li>
                Caption: <strong>{w(s.captionLength[0].key).toLowerCase()}</strong> ({s.captionLength[0].medianEr}%)
              </li>
            )}
            {s.collab.length > 1 && (
              <li>
                {w(s.collab[0].key)} {t("rinde más", "performs better")} ({s.collab[0].medianEr}% vs {s.collab[1].medianEr}%)
              </li>
            )}
          </ul>
        </div>
      </div>

      {pb && (
        <div className="mt-sp-4 grid gap-sp-4 border-t border-line pt-sp-4 md:grid-cols-2">
          <p className="text-sm text-ink/75 md:col-span-2">{pb.summary}</p>
          <PlaybookList title={t("Qué funciona", "What works")} items={pb.whatWorks} />
          <PlaybookList title={t("Qué evitar", "What to avoid")} items={pb.whatDoesnt} />
          <PlaybookList title={t("Ganchos que enganchan", "Hooks that hook")} items={pb.hooks} />
          <PlaybookList title={t("Para tu próximo contenido", "For your next content")} items={pb.recommendations} />
        </div>
      )}
    </Card>
  );
}

function PlaybookList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-sp-2 flex list-disc flex-col gap-1 pl-sp-4 text-sm text-ink/75">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
