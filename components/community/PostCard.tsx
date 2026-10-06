import Link from "next/link";
import AuthorBadge, { type Author } from "./AuthorBadge";
import { postKindLabel, timeAgo, topicLabel } from "@/lib/community";
import type { AdminLang, T } from "@/lib/admin-lang";

export interface PostCardData {
  id: string;
  kind: string;
  topic: string;
  title: string;
  body: string;
  titleEn?: string | null;
  bodyEn?: string | null;
  imageUrl: string | null;
  helpfulCount: number;
  replyCount: number;
  bestReplyId: string | null;
  pinned: boolean;
  fromTeam: boolean;
  createdAt: Date;
  profile: Author;
}

const KIND_STYLE: Record<string, string> = {
  pregunta: "bg-cobalt/15 text-cobalt-ink",
  consejo: "bg-lime/30 text-moss",
  logro: "bg-coral/15 text-coral",
  colaboracion: "bg-ink text-cream",
  recurso: "bg-sage/30 text-ink",
};

/** Una publicación en el muro (resumen con enlace a la publicación completa). */
export default function PostCard({ post, lang, t }: { post: PostCardData; lang: AdminLang; t: T }) {
  const title = lang === "en" && post.titleEn ? post.titleEn : post.title;
  const body = lang === "en" && post.bodyEn ? post.bodyEn : post.body;
  const excerpt = body.length > 260 ? `${body.slice(0, 260).trimEnd()}…` : body;
  return (
    <article className={`rounded-[18px] border bg-white p-sp-4 sm:p-sp-5 ${post.pinned ? "border-coral ring-2 ring-coral/15" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-sp-2">
        <AuthorBadge author={post.profile} lang={lang} meta={timeAgo(post.createdAt, lang)} />
        <div className="flex flex-wrap gap-1">
          {post.pinned && <span className="rounded-full bg-coral px-sp-2 py-0.5 font-mono text-[10px] uppercase text-white">{t("📌 Fijada", "📌 Pinned")}</span>}
          {post.fromTeam && <span className="rounded-full bg-ink px-sp-2 py-0.5 font-mono text-[10px] uppercase text-cream">{t("Equipo Foliocrew", "Foliocrew team")}</span>}
          <span className={`rounded-full px-sp-2 py-0.5 font-mono text-[10px] uppercase ${KIND_STYLE[post.kind] ?? "bg-cream text-ink/70"}`}>{postKindLabel(post.kind, lang)}</span>
        </div>
      </div>
      <Link href={`/admin/comunidad/${post.id}`} className="mt-sp-3 block">
        <h2 className="font-fraunces text-xl font-semibold leading-snug text-ink hover:text-coral">{title}</h2>
        <p className="mt-1 whitespace-pre-line break-words text-sm text-ink/70">{excerpt}</p>
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="mt-sp-3 max-h-72 w-full rounded-[12px] object-cover" loading="lazy" />
        )}
      </Link>
      <div className="mt-sp-3 flex flex-wrap items-center gap-x-sp-4 gap-y-1 text-xs text-ink/55">
        <span>💡 {post.helpfulCount} {t("me sirvió", "helpful")}</span>
        <span>
          💬 {post.replyCount} {post.replyCount === 1 ? t("respuesta", "reply") : t("respuestas", "replies")}
        </span>
        {post.bestReplyId && <span className="font-semibold text-moss">{t("✓ Resuelta", "✓ Solved")}</span>}
        <span className="ml-auto">#{topicLabel(post.topic, lang)}</span>
      </div>
    </article>
  );
}
