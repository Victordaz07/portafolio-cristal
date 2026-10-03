import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { engagementRate } from "@/lib/metrics";
import { MIN_VIEWS, median, nicheOf } from "@/lib/platform-analytics";
import { MIN_CREATORS, MIN_POSTS, insightForNiche } from "@/lib/insights";
import Card from "./Card";
import ShareInsightsButton from "./ShareInsightsButton";

const eyebrowClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";
const PLATFORM_NAMES: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", ugc: "UGC" };

/** "Lo que funciona en tu nicho": comparativa con resultados reales y anónimos de otras cuentas (solo si participas). */
export default async function InsightsCard() {
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
        <p className={eyebrowClass}>Inteligencia Foliocrew</p>
        <h2 className="mt-sp-2 font-fraunces text-xl font-semibold text-ink">Descubre qué funciona en tu nicho</h2>
        <p className="mt-sp-2 max-w-2xl text-sm text-ink/70">
          Si te sumas, comparamos tus resultados con los de otras cuentas de <strong>{niche.label}</strong>: mejores días y horarios, formatos que
          más enganchan y lo que conviene evitar. A cambio, tus métricas cuentan (de forma anónima y agregada) para ayudar a las demás.
        </p>
        <ul className="mt-sp-3 flex flex-col gap-1 text-xs text-ink/60">
          <li>· Nadie ve tu nombre, tu usuario ni tus marcas: solo promedios de grupos de {MIN_CREATORS} cuentas o más.</li>
          <li>· Las sugerencias de IA de tu panel empiezan a usar estos datos reales.</li>
          <li>· Puedes salir cuando quieras desde Mi cuenta.</li>
        </ul>
        <div className="mt-sp-4">
          <ShareInsightsButton share label="Sumarme" />
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
        <p className={eyebrowClass}>Inteligencia Foliocrew · participas</p>
        <h2 className="mt-sp-2 font-fraunces text-xl font-semibold text-ink">Estamos juntando datos</h2>
        <p className="mt-sp-2 max-w-2xl text-sm text-ink/70">
          Para proteger la privacidad de todas, la comparativa aparece cuando haya al menos {MIN_CREATORS} cuentas participando y {MIN_POSTS}{" "}
          publicaciones medidas (con {MIN_VIEWS}+ vistas). Mientras tanto, carga las métricas de tus publicaciones en Contenido.
        </p>
        <p className="mt-sp-2 text-xs text-ink/55">Tienes {cards.length} publicaciones medidas.</p>
      </Card>
    );
  }

  const s = insight.stats;
  const diff = myEr != null && s.medianEr != null ? Math.round((myEr - s.medianEr) * 10) / 10 : null;
  const updated = insight.generatedAt.toLocaleDateString("es", { day: "numeric", month: "long" });

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-sp-3">
        <div>
          <p className={eyebrowClass}>Inteligencia Foliocrew · {insight.label}</p>
          <h2 className="mt-sp-2 font-fraunces text-xl font-semibold text-ink">Lo que funciona en tu nicho</h2>
          <p className="mt-1 text-xs text-ink/55">
            {insight.isOwnNiche ? "" : `Tu nicho aún no tiene suficientes cuentas, así que ves el promedio de toda la plataforma. `}
            {insight.creators} cuentas · {insight.posts} publicaciones · actualizado el {updated}
          </p>
        </div>
      </div>

      <div className="mt-sp-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] bg-cream p-sp-4">
          <p className="font-fraunces text-2xl font-semibold text-ink">{myEr == null ? "—" : `${myEr}%`}</p>
          <p className="text-xs text-ink/60">Tu engagement mediano</p>
        </div>
        <div className="rounded-[14px] bg-cream p-sp-4">
          <p className="font-fraunces text-2xl font-semibold text-ink">{s.medianEr == null ? "—" : `${s.medianEr}%`}</p>
          <p className="text-xs text-ink/60">Mediana del {insight.isOwnNiche ? "nicho" : "grupo"}</p>
        </div>
        <div className="rounded-[14px] bg-cream p-sp-4">
          <p className="font-fraunces text-2xl font-semibold text-ink">{diff == null ? "—" : `${diff >= 0 ? "+" : "−"}${Math.abs(diff)} pts`}</p>
          <p className="text-xs text-ink/60">{diff == null ? "Carga métricas para compararte" : diff >= 0 ? "Por encima de la mediana" : "Por debajo de la mediana"}</p>
        </div>
      </div>

      <div className="mt-sp-4 grid gap-sp-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-ink">Mejores momentos para publicar</p>
          {s.bestSlots.length ? (
            <ul className="mt-sp-2 flex flex-col gap-1 text-sm text-ink/75">
              {s.bestSlots.map((b) => (
                <li key={`${b.day}-${b.slot}`}>
                  {b.day}, {b.slot.toLowerCase()} · <strong className="font-mono">{b.median}%</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-sp-2 text-sm text-ink/55">Aún no hay suficientes publicaciones con fecha.</p>
          )}
          {s.worstSlots.length > 0 && (
            <p className="mt-sp-2 text-xs text-ink/55">Rinden menos: {s.worstSlots.map((w) => `${w.day} ${w.slot.toLowerCase()}`).join(", ")}.</p>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Formatos y redes</p>
          <ul className="mt-sp-2 flex flex-col gap-1 text-sm text-ink/75">
            {s.byType.length > 1 && (
              <li>
                Formato: <strong>{s.byType[0].key}</strong> ({s.byType[0].medianEr}%)
              </li>
            )}
            {s.byPlatform.length > 1 && (
              <li>
                Red: <strong>{PLATFORM_NAMES[s.byPlatform[0].key] ?? s.byPlatform[0].key}</strong> ({s.byPlatform[0].medianEr}%)
              </li>
            )}
            {s.captionLength.length > 1 && (
              <li>
                Caption: <strong>{s.captionLength[0].key.toLowerCase()}</strong> ({s.captionLength[0].medianEr}%)
              </li>
            )}
            {s.collab.length > 1 && (
              <li>
                {s.collab[0].key} rinde más ({s.collab[0].medianEr}% vs {s.collab[1].medianEr}%)
              </li>
            )}
          </ul>
        </div>
      </div>

      {insight.playbook && (
        <div className="mt-sp-4 grid gap-sp-4 border-t border-line pt-sp-4 md:grid-cols-2">
          <p className="text-sm text-ink/75 md:col-span-2">{insight.playbook.summary}</p>
          <PlaybookList title="Qué funciona" items={insight.playbook.whatWorks} />
          <PlaybookList title="Qué evitar" items={insight.playbook.whatDoesnt} />
          <PlaybookList title="Ganchos que enganchan" items={insight.playbook.hooks} />
          <PlaybookList title="Para tu próximo contenido" items={insight.playbook.recommendations} />
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
