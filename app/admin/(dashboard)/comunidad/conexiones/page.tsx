import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { timeAgo } from "@/lib/community";
import type { AdminLang } from "@/lib/admin-lang";
import { postAuthorSelect } from "@/lib/community-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AuthorBadge, { type Author } from "@/components/community/AuthorBadge";
import ConnectButton from "@/components/community/ConnectButton";

export const dynamic = "force-dynamic";

/** Mis conexiones de la comunidad: solicitudes que me llegaron, con quién estoy conectado y lo que envié. */
export default async function ConnectionsPage() {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const me = session.creatorId;

  const rows = await prismaRoot.communityConnection.findMany({
    where: {
      OR: [
        { addresseeId: me, status: { in: ["pending", "accepted"] } },
        { requesterId: me, status: { in: ["pending", "declined", "accepted"] } },
      ],
    },
    orderBy: [{ respondedAt: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
  const otherOf = (r: (typeof rows)[number]) => (r.requesterId === me ? r.addresseeId : r.requesterId);
  const profiles = await prismaRoot.communityProfile.findMany({
    where: { creatorId: { in: rows.map(otherOf) }, creator: { status: "active" } },
    select: { ...postAuthorSelect, creatorId: true, headline: true },
  });
  const byCreator = new Map(profiles.map((p) => [p.creatorId, p]));
  const withProfile = rows.flatMap((r) => {
    const profile = byCreator.get(otherOf(r));
    return profile ? [{ ...r, profile }] : [];
  });
  const incoming = withProfile.filter((r) => r.addresseeId === me && r.status === "pending");
  const connected = withProfile.filter((r) => r.status === "accepted");
  // Rechazar es silencioso: lo que envié y me rechazaron se sigue viendo como "enviada".
  const sent = withProfile.filter((r) => r.requesterId === me && r.status !== "accepted");
  const canAct = !session.actorId;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("Conexiones", "Connections")}
        description={t(
          "Conecta con otros creadores para escribirse mensajes y armar colaboraciones.",
          "Connect with other creators to message each other and team up on collabs."
        )}
      />

      {incoming.length > 0 && (
        <Card className="border-coral/40">
          <SectionTitle>
            {t("Solicitudes para ti", "Requests for you")} · {incoming.length}
          </SectionTitle>
          <ul className="flex flex-col">
            {incoming.map((r) => (
              <Row key={r.id} author={r.profile} headline={r.profile.headline} meta={timeAgo(r.createdAt, lang)} lang={lang}>
                {r.note && <p className="mt-sp-2 rounded-[12px] bg-cream px-sp-3 py-sp-2 text-sm italic text-ink/70">“{r.note}”</p>}
                {canAct && (
                  <div className="mt-sp-2">
                    <ConnectButton handle={r.profile.creator.slug} name={r.profile.displayName} state="incoming" connectionId={r.id} compact />
                  </div>
                )}
              </Row>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <SectionTitle>
          {t("Mis conexiones", "My connections")} · {connected.length}
        </SectionTitle>
        {connected.length === 0 ? (
          <p className="text-sm text-ink/60">
            {t("Todavía no tienes conexiones. Entra al perfil de alguien del ", "You don't have connections yet. Open someone's profile from the ")}
            <Link href="/admin/comunidad" className="font-semibold text-coral hover:underline">
              {t("muro", "wall")}
            </Link>
            {t(" y toca «Conectar».", " and tap “Connect”.")}
          </p>
        ) : (
          <ul className="flex flex-col">
            {connected.map((r) => (
              <Row key={r.id} author={r.profile} headline={r.profile.headline} lang={lang}>
                {canAct && (
                  <Link href={`/admin/comunidad/mensajes/${r.profile.creator.slug}`} className="mt-sp-2 inline-block text-xs font-semibold text-coral hover:underline">
                    {t("💬 Enviar mensaje", "💬 Send message")}
                  </Link>
                )}
              </Row>
            ))}
          </ul>
        )}
      </Card>

      {sent.length > 0 && (
        <Card>
          <SectionTitle>
            {t("Solicitudes enviadas", "Sent requests")} · {sent.length}
          </SectionTitle>
          <ul className="flex flex-col">
            {sent.map((r) => (
              <Row key={r.id} author={r.profile} headline={r.profile.headline} meta={timeAgo(r.createdAt, lang)} lang={lang}>
                {canAct && (
                  <div className="mt-sp-2">
                    <ConnectButton handle={r.profile.creator.slug} name={r.profile.displayName} state="outgoing" connectionId={r.id} compact />
                  </div>
                )}
              </Row>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{children}</p>;
}

function Row({
  author,
  headline,
  meta,
  lang,
  children,
}: {
  author: Author;
  headline: string;
  meta?: string;
  lang: AdminLang;
  children?: React.ReactNode;
}) {
  return (
    <li className="border-t border-line py-sp-3 first:border-0 first:pt-0">
      <AuthorBadge author={author} lang={lang} meta={meta} />
      {headline && <p className="mt-1 text-sm text-ink/65">{headline}</p>}
      {children}
    </li>
  );
}
