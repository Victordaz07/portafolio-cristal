import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { blockedIds, postAuthorSelect } from "@/lib/community-server";
import { canEditWithin, creatorTypeLabel, postKindLabel, timeAgo, topicLabel, type PostKind } from "@/lib/community";
import Card from "@/components/admin/Card";
import AuthorBadge from "@/components/community/AuthorBadge";
import LinkifiedText from "@/components/community/LinkifiedText";
import PostOwnerActions from "./PostOwnerActions";

export const dynamic = "force-dynamic";

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;
  const [post, blocked] = await Promise.all([
    prismaRoot.communityPost.findUnique({
      where: { id },
      include: {
        profile: { select: postAuthorSelect },
        creator: { select: { status: true } },
        replies: {
          where: { hiddenAt: null, deletedAt: null },
          orderBy: { createdAt: "asc" },
          include: { profile: { select: postAuthorSelect } },
        },
      },
    }),
    blockedIds(session.creatorId),
  ]);
  if (!post || post.deletedAt || post.hiddenAt || post.creator.status !== "active" || blocked.includes(post.creatorId)) notFound();
  const isMine = post.creatorId === session.creatorId && !session.actorId;
  const replies = post.replies.filter((r) => !blocked.includes(r.creatorId));
  // La mejor respuesta va primero.
  replies.sort((a, b) => (a.id === post.bestReplyId ? -1 : b.id === post.bestReplyId ? 1 : 0));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-sp-4">
      <Link href="/admin/comunidad" className="text-sm font-medium text-coral hover:underline">
        {t("← Volver al muro", "← Back to the wall")}
      </Link>
      <Card className="flex flex-col gap-sp-4">
        <div className="flex flex-wrap items-start justify-between gap-sp-2">
          <AuthorBadge author={post.profile} lang={lang} meta={timeAgo(post.createdAt, lang)} size={44} />
          <div className="flex flex-wrap gap-1 text-[10px]">
            {post.fromTeam && <span className="rounded-full bg-ink px-sp-2 py-0.5 font-mono uppercase text-cream">{t("Equipo Foliocrew", "Foliocrew team")}</span>}
            <span className="rounded-full bg-cream px-sp-2 py-0.5 font-mono uppercase text-ink/70">{postKindLabel(post.kind, lang)}</span>
            <span className="rounded-full bg-cream px-sp-2 py-0.5 font-mono uppercase text-ink/70">#{topicLabel(post.topic, lang)}</span>
          </div>
        </div>
        <h1 className="font-fraunces text-3xl font-semibold leading-tight text-ink">{post.title}</h1>
        <LinkifiedText text={post.body} className="text-[15px] leading-relaxed text-ink/85" />
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="max-h-[520px] w-full rounded-[14px] object-contain" />
        )}
        {post.creatorTypes.length > 0 && (
          <p className="flex flex-wrap gap-1 text-xs">
            <span className="text-ink/50">{post.kind === "colaboracion" ? t("Busca:", "Looking for:") : t("Para:", "For:")}</span>
            {post.creatorTypes.map((ct) => (
              <span key={ct} className="rounded-full border border-line px-sp-2 py-0.5 text-ink/70">
                {creatorTypeLabel(ct, lang)}
              </span>
            ))}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-sp-4 gap-y-2 border-t border-line pt-sp-3 text-xs text-ink/55">
          <span>💡 {post.helpfulCount} {t("me sirvió", "helpful")}</span>
          <span>
            💬 {post.replyCount} {post.replyCount === 1 ? t("respuesta", "reply") : t("respuestas", "replies")}
          </span>
          {isMine && (
            <PostOwnerActions
              postId={post.id}
              canEdit={canEditWithin(post.createdAt)}
              values={{
                kind: post.kind as PostKind,
                topic: post.topic,
                title: post.title,
                body: post.body,
                imageUrl: post.imageUrl ?? "",
                creatorTypes: post.creatorTypes,
              }}
            />
          )}
        </div>
      </Card>

      <p className="mt-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">
        {replies.length ? t(`${replies.length} respuestas`, `${replies.length} replies`) : t("Respuestas", "Replies")}
      </p>
      {replies.length === 0 ? (
        <Card className="text-sm text-ink/60">{t("Todavía nadie respondió.", "No replies yet.")}</Card>
      ) : (
        replies.map((r) => (
          <Card key={r.id} className={`flex flex-col gap-sp-2 ${r.id === post.bestReplyId ? "border-moss ring-2 ring-lime/40" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-sp-2">
              <AuthorBadge author={r.profile} lang={lang} meta={timeAgo(r.createdAt, lang)} />
              {r.id === post.bestReplyId && (
                <span className="rounded-full bg-lime/40 px-sp-2 py-0.5 font-mono text-[10px] uppercase text-moss">{t("✓ Mejor respuesta", "✓ Best answer")}</span>
              )}
            </div>
            <LinkifiedText text={r.body} className="text-sm text-ink/85" />
            <span className="text-xs text-ink/50">💡 {r.helpfulCount}</span>
          </Card>
        ))
      )}
    </div>
  );
}
