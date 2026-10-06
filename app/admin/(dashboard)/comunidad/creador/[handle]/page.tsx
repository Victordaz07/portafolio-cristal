import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { blockedIds, profileByHandle } from "@/lib/community-server";
import { connectionState, creatorTypeLabel, levelLabel, postKindLabel } from "@/lib/community";
import { connectionBetween } from "@/lib/community-connections";
import { creatorSiteUrl } from "@/lib/site-url";
import { NICHES } from "@/lib/onboarding";
import { dateLocale, pickLabel } from "@/lib/admin-lang";
import Card from "@/components/admin/Card";
import CommunityAvatar from "@/components/community/CommunityAvatar";
import ReportButton from "@/components/community/ReportButton";
import BlockButton from "@/components/community/BlockButton";
import ConnectButton from "@/components/community/ConnectButton";

export const dynamic = "force-dynamic";

/** Perfil de comunidad de otra persona (o el mío, como lo ven los demás). */
export default async function CreatorCommunityProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const { handle } = await params;
  const found = await profileByHandle(handle);
  if (!found) notFound();
  const { creator, profile } = found;
  const isMe = creator.id === session.creatorId;
  if (!isMe && (await blockedIds(session.creatorId)).includes(creator.id)) notFound();

  const [posts, siteUrl, connection, connections] = await Promise.all([
    prismaRoot.communityPost.findMany({
      where: { creatorId: creator.id, hiddenAt: null, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, kind: true, title: true, replyCount: true, helpfulCount: true, createdAt: true },
    }),
    profile.showSite ? creatorSiteUrl(creator) : Promise.resolve(null),
    isMe ? Promise.resolve(null) : connectionBetween(session.creatorId, creator.id),
    prismaRoot.communityConnection.count({ where: { status: "accepted", OR: [{ requesterId: creator.id }, { addresseeId: creator.id }] } }),
  ]);
  const state = connectionState(connection, session.creatorId);
  const niche = NICHES.find((n) => n.id === profile.niche);
  const fmt = (d: Date) => d.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-sp-5">
      <Link href="/admin/comunidad" className="text-sm font-medium text-coral hover:underline">
        {t("← Volver al muro", "← Back to the wall")}
      </Link>
      <Card className="flex flex-col gap-sp-4 sm:flex-row sm:items-start">
        <CommunityAvatar name={profile.displayName} url={profile.avatarUrl} size={96} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-sp-3 gap-y-1">
            <h1 className="font-fraunces text-3xl font-semibold text-ink">{profile.displayName}</h1>
            <span className="font-mono text-sm text-ink/50">@{creator.slug}</span>
          </div>
          {profile.headline && <p className="mt-1 text-ink/75">{profile.headline}</p>}
          <div className="mt-sp-3 flex flex-wrap gap-sp-2 text-xs">
            <span className="rounded-full bg-ink px-sp-3 py-1 font-semibold text-cream">
              {levelLabel(profile.reputation, lang)} · {profile.reputation} {t("pts", "pts")}
            </span>
            {niche && <span className="rounded-full bg-lime/30 px-sp-3 py-1 text-moss">{pickLabel(lang, niche)}</span>}
            {profile.creatorTypes.map((ct) => (
              <span key={ct} className="rounded-full border border-line px-sp-3 py-1 text-ink/70">
                {creatorTypeLabel(ct, lang)}
              </span>
            ))}
            {profile.openToCollab && (
              <span className="rounded-full bg-coral/15 px-sp-3 py-1 font-semibold text-coral">{t("🤝 Abierto a colaborar", "🤝 Open to collabs")}</span>
            )}
          </div>
          {profile.bio && <p className="mt-sp-3 whitespace-pre-line text-sm text-ink/75">{profile.bio}</p>}
          <p className="mt-sp-3 flex flex-wrap gap-x-sp-4 gap-y-1 text-sm text-ink/60">
            <span>
              🤝 {connections} {connections === 1 ? t("conexión", "connection") : t("conexiones", "connections")}
            </span>
            {profile.showCity && profile.city && <span>📍 {profile.city}</span>}
            {profile.languages.length > 0 && (
              <span>🗣️ {profile.languages.map((l) => (l === "en" ? t("Inglés", "English") : t("Español", "Spanish"))).join(" · ")}</span>
            )}
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noreferrer" className="font-semibold text-coral hover:underline">
                {t("Ver su sitio ↗", "View their site ↗")}
              </a>
            )}
          </p>
        </div>
        {isMe ? (
          <Link href="/admin/comunidad/perfil" className="self-start text-sm font-semibold text-coral hover:underline">
            {t("Editar mi perfil", "Edit my profile")}
          </Link>
        ) : (
          !session.actorId && (
            <div className="flex flex-col items-start gap-sp-3 self-start sm:items-end">
              <div className="flex flex-wrap items-center gap-sp-2">
                {state === "connected" && (
                  <Link href={`/admin/comunidad/mensajes/${creator.slug}`} className="rounded-full bg-ink px-sp-4 py-sp-2 text-sm font-semibold text-cream hover:bg-coral">
                    {t("💬 Mensaje", "💬 Message")}
                  </Link>
                )}
                <ConnectButton handle={creator.slug} name={profile.displayName} state={state} connectionId={connection?.id ?? null} />
              </div>
              {state === "incoming" && connection?.note && (
                <p className="max-w-xs rounded-[12px] bg-cream px-sp-3 py-sp-2 text-sm italic text-ink/70">“{connection.note}”</p>
              )}
              <div className="flex gap-sp-3">
                <ReportButton targetType="profile" targetId={profile.id} />
                <BlockButton handle={creator.slug} name={profile.displayName} blocked={false} />
              </div>
            </div>
          )
        )}
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Publicaciones", "Posts")}</p>
        {posts.length === 0 ? (
          <p className="text-sm text-ink/55">{t("Todavía no ha publicado.", "No posts yet.")}</p>
        ) : (
          <ul className="flex flex-col">
            {posts.map((p) => (
              <li key={p.id} className="border-t border-line py-sp-2 first:border-0 first:pt-0">
                <Link href={`/admin/comunidad/${p.id}`} className="font-semibold text-ink hover:text-coral">
                  {p.title}
                </Link>
                <p className="text-xs text-ink/50">
                  {postKindLabel(p.kind, lang)} · {fmt(p.createdAt)} · 💬 {p.replyCount} · 💡 {p.helpfulCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
