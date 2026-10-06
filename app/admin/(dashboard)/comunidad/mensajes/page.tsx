import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { isUnread, timeAgo } from "@/lib/community";
import { blockedIds, postAuthorSelect } from "@/lib/community-server";
import { connectedIds } from "@/lib/community-connections";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import CommunityAvatar from "@/components/community/CommunityAvatar";

export const dynamic = "force-dynamic";

/** Bandeja de mensajes directos de la comunidad. */
export default async function MessagesPage() {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const header = (
    <PageHeader
      eyebrow={t("Comunidad", "Community")}
      title={t("Mensajes", "Messages")}
      description={t("Conversaciones privadas con tus conexiones.", "Private conversations with your connections.")}
    />
  );
  if (session.actorId) {
    return (
      <div className="flex flex-col gap-sp-5">
        {header}
        <Card className="text-sm text-ink/70">
          {t("🔒 Los mensajes son privados: el equipo no puede leerlos al entrar como esta cuenta.", "🔒 Messages are private: the team can't read them when signed in as this account.")}
        </Card>
      </div>
    );
  }
  const me = session.creatorId;
  const [conversations, blocked, connected] = await Promise.all([
    prismaRoot.communityConversation.findMany({
      where: { OR: [{ aId: me }, { bId: me }] },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: { messages: { where: { hiddenAt: null }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true } } },
    }),
    blockedIds(me),
    connectedIds(me),
  ]);
  const otherOf = (c: { aId: string; bId: string }) => (c.aId === me ? c.bId : c.aId);
  const visible = conversations.filter((c) => !blocked.includes(otherOf(c)) && c.messages.length > 0);
  const withChat = new Set(visible.map(otherOf));
  const profiles = await prismaRoot.communityProfile.findMany({
    where: { creatorId: { in: [...visible.map(otherOf), ...connected] }, creator: { status: "active" } },
    select: { ...postAuthorSelect, creatorId: true },
  });
  const byCreator = new Map(profiles.map((p) => [p.creatorId, p]));
  const startNew = connected.filter((id) => !withChat.has(id) && !blocked.includes(id)).flatMap((id) => byCreator.get(id) ?? []);

  return (
    <div className="flex flex-col gap-sp-5">
      {header}
      <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(36,18,39,0.04)]">
        {visible.length === 0 ? (
          <p className="p-sp-5 text-sm text-ink/60">
            {connected.length === 0 ? (
              <>
                {t("Para escribirle a alguien primero tienen que estar conectados. Mira tus ", "To message someone you need to be connected first. Check your ")}
                <Link href="/admin/comunidad/conexiones" className="font-semibold text-coral hover:underline">
                  {t("conexiones", "connections")}
                </Link>
                .
              </>
            ) : (
              t("Todavía no tienes conversaciones. Escríbele a una de tus conexiones 👇", "No conversations yet. Message one of your connections 👇")
            )}
          </p>
        ) : (
          <ul className="flex flex-col">
            {visible.map((c) => {
              const p = byCreator.get(otherOf(c));
              if (!p) return null;
              const lastMsg = c.messages[0];
              const unread = isUnread(c, me);
              return (
                <li key={c.id} className="border-t border-line first:border-0">
                  <Link href={`/admin/comunidad/mensajes/${p.creator.slug}`} className="flex items-center gap-sp-3 px-sp-4 py-sp-3 hover:bg-cream/60 sm:px-sp-5">
                    <CommunityAvatar name={p.displayName} url={p.avatarUrl} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-sp-2">
                        <span className={`truncate text-sm ${unread ? "font-bold text-ink" : "font-semibold text-ink/85"}`}>{p.displayName}</span>
                        <span className="shrink-0 text-[11px] text-ink/45">{timeAgo(c.lastMessageAt, lang)}</span>
                      </span>
                      <span className={`block truncate text-sm ${unread ? "font-semibold text-ink" : "text-ink/55"}`}>
                        {lastMsg.senderId === me ? t("Tú: ", "You: ") : ""}
                        {lastMsg.body}
                      </span>
                    </span>
                    {unread && <span aria-label={t("Sin leer", "Unread")} className="h-2.5 w-2.5 shrink-0 rounded-full bg-coral" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {startNew.length > 0 && (
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Escribe a una conexión", "Message a connection")}</p>
          <div className="flex flex-wrap gap-sp-2">
            {startNew.map((p) => (
              <Link
                key={p.id}
                href={`/admin/comunidad/mensajes/${p.creator.slug}`}
                className="flex items-center gap-sp-2 rounded-full border border-line bg-white py-1 pl-1 pr-sp-3 text-sm font-semibold text-ink hover:border-coral"
              >
                <CommunityAvatar name={p.displayName} url={p.avatarUrl} size={28} />
                {p.displayName}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
