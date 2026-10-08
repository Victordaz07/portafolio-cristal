import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { ensureProfile, feedPosts } from "@/lib/community-server";
import { CREATOR_TYPES, LIMITS, POST_KINDS, TOPICS, isCreatorType, isPostKind, isTopic } from "@/lib/community";
import { pickLabel } from "@/lib/admin-lang";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import PostCard from "@/components/community/PostCard";
import NewPostForm from "./NewPostForm";
import { requireModule } from "@/lib/releases-server";

export const dynamic = "force-dynamic";

type Params = { tab?: string; tipo?: string; tema?: string; creador?: string; n?: string };

export default async function CommunityWallPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireModule("muro");
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  const tab = sp.tab === "destacadas" ? "destacadas" : "recientes";
  const kind = isPostKind(sp.tipo) ? sp.tipo : undefined;
  const topic = isTopic(sp.tema) ? sp.tema : undefined;
  const type = isCreatorType(sp.creador) ? sp.creador : undefined;
  const take = Math.min(200, Math.max(LIMITS.pageSize, Number(sp.n) || LIMITS.pageSize));

  const [profile, user, feed] = await Promise.all([
    ensureProfile(session.creatorId),
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } }),
    feedPosts(session.creatorId, { tab, kind, topic, type, take }),
  ]);
  const joined = Boolean(profile.acceptedRulesAt);

  // Novedades: respuestas de otras personas en mis publicaciones desde mi última visita.
  const since = profile.lastSeenAt ?? profile.acceptedRulesAt;
  const news =
    joined && since && !session.actorId
      ? await prismaRoot.communityReply.groupBy({
          by: ["postId"],
          where: { createdAt: { gt: since }, creatorId: { not: session.creatorId }, hiddenAt: null, deletedAt: null, post: { creatorId: session.creatorId, deletedAt: null, hiddenAt: null } },
          _count: { _all: true },
        })
      : [];
  const newsPosts = news.length
    ? await prismaRoot.communityPost.findMany({ where: { id: { in: news.map((n) => n.postId) } }, select: { id: true, title: true } })
    : [];
  if (joined && !session.actorId) {
    // Al ver el muro, el contador del menú vuelve a 0.
    await prismaRoot.communityProfile.update({ where: { id: profile.id }, data: { lastSeenAt: new Date() } });
  }

  const href = (change: Partial<Params>) => {
    const next = { tab, tipo: kind, tema: topic, creador: type, ...change };
    const qs = new URLSearchParams();
    if (next.tab && next.tab !== "recientes") qs.set("tab", next.tab);
    if (next.tipo) qs.set("tipo", next.tipo);
    if (next.tema) qs.set("tema", next.tema);
    if (next.creador) qs.set("creador", next.creador);
    if (next.n) qs.set("n", next.n);
    const s = qs.toString();
    return `/admin/comunidad${s ? `?${s}` : ""}`;
  };
  const chip = (on: boolean) =>
    `whitespace-nowrap rounded-full px-sp-3 py-1 text-xs font-semibold transition ${on ? "bg-ink text-cream" : "border border-line bg-white text-ink/70 hover:border-coral"}`;
  const filtered = Boolean(kind || topic || type);

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("El muro de los creadores", "The creators' wall")}
        description={t(
          "Preguntas, consejos, logros y colaboraciones entre creadores de todo tipo. Solo lo ven cuentas de Foliocrew.",
          "Questions, tips, wins and collaborations between every kind of creator. Only Foliocrew accounts can see it."
        )}
      />

      {!joined ? (
        <Card className="flex flex-wrap items-center justify-between gap-sp-3">
          <p className="text-sm text-ink/75">
            {t("Para publicar y responder, revisa tu perfil y acepta las reglas (toma 1 minuto).", "To post and reply, review your profile and accept the rules (takes 1 minute).")}
          </p>
          <Link href="/admin/comunidad/perfil" className="rounded-full bg-ink px-sp-4 py-sp-2 text-sm font-semibold text-cream hover:bg-coral">
            {t("Entrar a la comunidad →", "Join the community →")}
          </Link>
        </Card>
      ) : !user?.emailVerifiedAt ? (
        <p className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">
          {t("Confirma tu correo para publicar y responder (revisa tu bandeja de entrada).", "Confirm your email to post and reply (check your inbox).")}
        </p>
      ) : (
        <NewPostForm />
      )}

      {newsPosts.length > 0 && (
        <Card className="border-coral/40">
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("🔔 Respuestas nuevas para ti", "🔔 New replies for you")}</p>
          <ul className="flex flex-col gap-1 text-sm">
            {newsPosts.map((p) => {
              const count = news.find((n) => n.postId === p.id)?._count._all ?? 0;
              return (
                <li key={p.id}>
                  <Link href={`/admin/comunidad/${p.id}`} className="font-semibold text-ink hover:text-coral">
                    {p.title}
                  </Link>{" "}
                  <span className="text-ink/55">
                    · {count} {count === 1 ? t("respuesta nueva", "new reply") : t("respuestas nuevas", "new replies")}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="flex flex-col gap-sp-3">
        <div className="flex flex-wrap items-center gap-sp-2">
          <Link href={href({ tab: "recientes" })} className={chip(tab === "recientes")}>
            {t("🕒 Recientes", "🕒 Latest")}
          </Link>
          <Link href={href({ tab: "destacadas" })} className={chip(tab === "destacadas")}>
            {t("🔥 Destacadas", "🔥 Top")}
          </Link>
          <Link href="/admin/comunidad/reglas" className="text-xs text-ink/50 hover:text-coral">
            {t("Reglas", "Rules")}
          </Link>
          {filtered && (
            <Link href={href({ tipo: undefined, tema: undefined, creador: undefined })} className="ml-auto text-xs font-semibold text-coral hover:underline">
              {t("Quitar filtros", "Clear filters")}
            </Link>
          )}
        </div>
        <FilterRow label={t("Tipo", "Type")}>
          {POST_KINDS.map((k) => (
            <Link key={k.id} href={href({ tipo: kind === k.id ? undefined : k.id })} className={chip(kind === k.id)}>
              {pickLabel(lang, k)}
            </Link>
          ))}
        </FilterRow>
        <FilterRow label={t("Tema", "Topic")}>
          {TOPICS.map((tp) => (
            <Link key={tp.id} href={href({ tema: topic === tp.id ? undefined : tp.id })} className={chip(topic === tp.id)}>
              {pickLabel(lang, tp)}
            </Link>
          ))}
        </FilterRow>
        <FilterRow label={t("Creadores", "Creators")}>
          {CREATOR_TYPES.map((ct) => (
            <Link key={ct.id} href={href({ creador: type === ct.id ? undefined : ct.id })} className={chip(type === ct.id)}>
              {pickLabel(lang, ct)}
            </Link>
          ))}
        </FilterRow>
      </div>

      <div className="flex flex-col gap-sp-3">
        {!filtered && feed.pinned.map((p) => <PostCard key={p.id} post={p} lang={lang} t={t} />)}
        {feed.posts.map((p) => (
          <PostCard key={p.id} post={p} lang={lang} t={t} />
        ))}
        {feed.posts.length === 0 && (
          <Card className="text-center text-sm text-ink/60">
            {filtered
              ? t("No hay publicaciones con estos filtros todavía.", "No posts with these filters yet.")
              : t("Todavía no hay publicaciones. ¡Rompe el hielo con una pregunta o un consejo!", "No posts yet. Break the ice with a question or a tip!")}
          </Card>
        )}
        {feed.hasMore && (
          <Link href={href({ n: String(take + LIMITS.pageSize) })} scroll={false} className="self-center rounded-full border border-line bg-white px-sp-5 py-sp-2 text-sm font-semibold text-ink hover:border-coral">
            {t("Cargar más", "Load more")}
          </Link>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-sp-2">
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink/45">{label}</span>
      <div className="-mx-1 flex min-w-0 gap-sp-2 overflow-x-auto px-1 pb-1">{children}</div>
    </div>
  );
}
