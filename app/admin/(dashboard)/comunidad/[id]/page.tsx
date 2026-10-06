import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { blockedIds, postAuthorSelect } from "@/lib/community-server";
import { canEditWithin, creatorTypeLabel, postKindLabel, timeAgo, topicLabel, type PostKind } from "@/lib/community";
import Card from "@/components/admin/Card";
import { plural } from "@/lib/admin-lang";
import AuthorBadge from "@/components/community/AuthorBadge";
import LinkifiedText from "@/components/community/LinkifiedText";
import PostOwnerActions from "./PostOwnerActions";
import ReplyForm from "./ReplyForm";
import ReplyActions from "./ReplyActions";
import HelpfulButton from "@/components/community/HelpfulButton";
import ReportButton from "@/components/community/ReportButton";

export const dynamic = "force-dynamic";

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;
  const [post, blocked, me] = await Promise.all([
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
    prismaRoot.communityProfile.findUnique({ where: { creatorId: session.creatorId }, select: { acceptedRulesAt: true } }),
  ]);
  if (!post || post.deletedAt || post.hiddenAt || post.creator.status !== "active" || blocked.includes(post.creatorId)) notFound();
  const isMine = post.creatorId === session.creatorId && !session.actorId;
  const replies = post.replies.filter((r) => !blocked.includes(r.creatorId));
  // La mejor respuesta va primero.
  replies.sort((a, b) => (a.id === post.bestReplyId ? -1 : b.id === post.bestReplyId ? 1 : 0));
  const reacted = new Set(
    (
      await prismaRoot.communityReaction.findMany({
        where: {
          creatorId: session.creatorId,
          OR: [
            { targetType: "post", targetId: post.id },
            { targetType: "reply", targetId: { in: replies.map((r) => r.id) } },
          ],
        },
        select: { targetType: true, targetId: true },
      })
    ).map((x) => `${x.targetType}:${x.targetId}`)
  );
  const readOnly = Boolean(session.actorId) || !me?.acceptedRulesAt;
  const iAsked = isMine && post.kind === "pregunta";

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
          <HelpfulButton
            targetType="post"
            targetId={post.id}
            count={post.helpfulCount}
            active={reacted.has(`post:${post.id}`)}
            disabled={readOnly || post.creatorId === session.creatorId}
          />
          <span>
            💬 {post.replyCount} {post.replyCount === 1 ? t("respuesta", "reply") : t("respuestas", "replies")}
          </span>
          {!isMine && !readOnly && <ReportButton targetType="post" targetId={post.id} className="ml-auto" />}
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
        {replies.length ? `${replies.length} ${plural(lang, replies.length, ["respuesta", "respuestas"], ["reply", "replies"])}` : t("Respuestas", "Replies")}
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
            <div className="flex flex-wrap items-center gap-sp-2">
              <HelpfulButton
                targetType="reply"
                targetId={r.id}
                count={r.helpfulCount}
                active={reacted.has(`reply:${r.id}`)}
                disabled={readOnly || r.creatorId === session.creatorId}
              />
              <ReplyActions
                postId={post.id}
                replyId={r.id}
                body={r.body}
                mine={r.creatorId === session.creatorId && !session.actorId}
                canEdit={canEditWithin(r.createdAt)}
                canPickBest={iAsked && r.creatorId !== session.creatorId}
                isBest={r.id === post.bestReplyId}
              />
              {r.creatorId !== session.creatorId && !readOnly && <ReportButton targetType="reply" targetId={r.id} />}
            </div>
          </Card>
        ))
      )}

      {readOnly ? (
        <Card className="text-sm text-ink/65">
          {session.actorId
            ? t("Estás viendo como equipo: puedes leer, pero no responder en nombre de la cuenta.", "You're viewing as the team: you can read, but not reply on behalf of the account.")
            : t("Para responder, entra a la comunidad desde Mi perfil y acepta las reglas.", "To reply, join the community from My profile and accept the rules.")}
        </Card>
      ) : (
        <Card>
          <p className="mb-sp-2 text-sm font-semibold text-ink">{t("Tu respuesta", "Your reply")}</p>
          <ReplyForm postId={post.id} />
          {iAsked && (
            <p className="mt-sp-2 text-xs text-ink/50">
              {t("Cuando una respuesta te ayude, márcala como “Mejor respuesta”: le suma 10 puntos a quien la escribió.", "When a reply helps you, mark it as “Best answer”: it gives the author 10 points.")}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
