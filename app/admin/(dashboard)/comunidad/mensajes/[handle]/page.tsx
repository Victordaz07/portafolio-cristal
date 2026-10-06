import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { connectionState, isUnread } from "@/lib/community";
import { blockedIds, participation, postAuthorSelect, profileByHandle } from "@/lib/community-server";
import { connectionBetween } from "@/lib/community-connections";
import { conversationWith, markRead } from "@/lib/community-messages";
import Card from "@/components/admin/Card";
import AuthorBadge from "@/components/community/AuthorBadge";
import ConnectButton from "@/components/community/ConnectButton";
import ChatThread from "./ChatThread";

export const dynamic = "force-dynamic";

/** Conversación privada con una conexión. */
export default async function ChatPage({ params }: { params: Promise<{ handle: string }> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  if (session.actorId) {
    return (
      <Card className="text-sm text-ink/70">
        {t("🔒 Los mensajes son privados: el equipo no puede leerlos al entrar como esta cuenta.", "🔒 Messages are private: the team can't read them when signed in as this account.")}
      </Card>
    );
  }
  const { handle } = await params;
  const found = await profileByHandle(handle);
  if (!found) notFound();
  const me = session.creatorId;
  if (found.creator.id === me) redirect("/admin/comunidad/mensajes");
  if ((await blockedIds(me)).includes(found.creator.id)) notFound();

  const [connection, conversation, author, can] = await Promise.all([
    connectionBetween(me, found.creator.id),
    conversationWith(me, found.creator.id),
    prismaRoot.communityProfile.findUnique({ where: { id: found.profile.id }, select: postAuthorSelect }),
    participation(session, t),
  ]);
  const state = connectionState(connection, me);
  const rows = conversation
    ? await prismaRoot.communityMessage.findMany({
        where: { conversationId: conversation.id, hiddenAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, senderId: true, body: true, createdAt: true },
      })
    : [];
  if (conversation && isUnread(conversation, me)) await markRead(conversation, me);
  const initial = rows.reverse().map((m) => ({ id: m.id, mine: m.senderId === me, body: m.body, createdAt: m.createdAt.toISOString() }));

  return (
    <div className="flex flex-col gap-sp-4">
      <Link href="/admin/comunidad/mensajes" className="text-sm font-medium text-coral hover:underline">
        {t("← Mensajes", "← Messages")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-sp-3">
        {author && <AuthorBadge author={author} lang={lang} size={44} />}
        {state !== "connected" && (
          <ConnectButton handle={found.creator.slug} name={found.profile.displayName} state={state} connectionId={connection?.id ?? null} compact />
        )}
      </div>
      {state !== "connected" && (
        <p className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">
          {t("Solo pueden escribirse cuando están conectados.", "You can only message each other once you're connected.")}
        </p>
      )}
      {state === "connected" && !can.ok && <p className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">{can.error}</p>}
      <ChatThread handle={found.creator.slug} initial={initial} canSend={state === "connected" && can.ok} />
    </div>
  );
}
