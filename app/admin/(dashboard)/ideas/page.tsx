import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import IdeaForm from "@/components/admin/IdeaForm";
import { ideaCategoryLabel, ideaStatus } from "@/lib/ideas";
import { dateLocale, pickLabel, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const fmt = (d: Date, lang: AdminLang) => d.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short" });

export default async function IdeasPage() {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const [mine, planned, done] = await Promise.all([
    prismaRoot.idea.findMany({ where: { creatorId: session.creatorId }, orderBy: { createdAt: "desc" }, take: 30 }),
    prismaRoot.idea.findMany({ where: { status: "planned" }, orderBy: { updatedAt: "desc" }, take: 12, select: { id: true, title: true, category: true } }),
    prismaRoot.idea.findMany({ where: { status: "done" }, orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, title: true, updatedAt: true } }),
  ]);

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Ayuda", "Help")}
        title={t("Ideas y sugerencias", "Ideas & suggestions")}
        description={t("¿Qué te gustaría que Foliocrew hiciera por ti? Cada idea la lee el equipo y te avisamos cuando esté en camino.", "What would you like Foliocrew to do for you? The team reads every idea and we'll let you know when it's on the way.")}
      />
      <Card>
        <IdeaForm url="/api/admin/ideas" submitLabel={t("Enviar idea", "Send idea")} placeholder={t("Ej.: Poder programar publicaciones de TikTok", "E.g.: Being able to schedule TikTok posts")} />
      </Card>

      <div className="grid gap-sp-5 md:grid-cols-2">
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("🚧 En camino", "🚧 On the way")}</p>
          {planned.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Pronto verás aquí lo que estamos preparando.", "Soon you'll see here what we're working on.")}</p>
          ) : (
            <ul className="flex flex-col gap-sp-2 text-sm">
              {planned.map((i) => (
                <li key={i.id} className="flex flex-wrap justify-between gap-sp-2">
                  <span className="font-semibold text-ink">{i.title}</span>
                  <span className="text-xs text-ink/50">{ideaCategoryLabel(i.category, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("✨ Recién lanzado", "✨ Just shipped")}</p>
          {done.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Aquí aparecerán las mejoras nuevas.", "New improvements will show up here.")}</p>
          ) : (
            <ul className="flex flex-col gap-sp-2 text-sm">
              {done.map((i) => (
                <li key={i.id} className="flex flex-wrap justify-between gap-sp-2">
                  <span className="font-semibold text-ink">{i.title}</span>
                  <span className="text-xs text-ink/50">{fmt(i.updatedAt, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tus sugerencias", "Your suggestions")}</p>
        {mine.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Todavía no enviaste ninguna. ¡La primera idea siempre es la mejor! 😉", "You haven't sent any yet. The first idea is always the best! 😉")}</p>
        ) : (
          <ul className="flex flex-col">
            {mine.map((i) => {
              const status = ideaStatus(i.status);
              return (
                <li key={i.id} className="flex flex-col gap-sp-1 border-t border-line py-sp-3 first:border-0">
                  <div className="flex flex-wrap items-center gap-sp-2">
                    <span className="flex-1 font-semibold text-ink">{i.title}</span>
                    <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${status.tone}`}>{pickLabel(lang, status)}</span>
                    <span className="text-xs text-ink/50">{fmt(i.createdAt, lang)}</span>
                  </div>
                  {i.teamReply && <p className="rounded-[12px] bg-cream px-sp-3 py-sp-2 text-sm text-ink">💬 {t("Equipo Foliocrew", "Foliocrew team")}: {i.teamReply}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
