import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { TIKTOK_DIRECT_SCOPE, TIKTOK_DRAFT_SCOPE, tiktokPostingFlags } from "@/lib/social/tiktok-posting";
import { needsReconnect } from "@/lib/social/token-refresh";
import TikTokPublisher from "./TikTokPublisher";

export const dynamic = "force-dynamic";

/**
 * «Publicar en TikTok» (Content Posting API). Solo existe si el dueño activó
 * TIKTOK_POSTING_DRAFT_ENABLED o TIKTOK_POSTING_DIRECT_ENABLED; si no, 404.
 */
export default async function TikTokPostPage() {
  const flags = tiktokPostingFlags();
  if (!flags.draft && !flags.direct) notFound();
  const { t } = await getT();
  const account = await prisma.socialAccount.findFirst({ where: { platform: "tiktok" }, select: { scopes: true, lastError: true } });
  const modes = {
    draft: flags.draft && Boolean(account?.scopes.includes(TIKTOK_DRAFT_SCOPE)),
    direct: flags.direct && Boolean(account?.scopes.includes(TIKTOK_DIRECT_SCOPE)),
  };
  const blocker = !account
    ? t("Primero conecta tu TikTok.", "Connect your TikTok first.")
    : needsReconnect(account.lastError)
      ? t("TikTok cerró la conexión con Foliocrew: vuelve a conectar la cuenta.", "TikTok closed the connection with Foliocrew: reconnect the account.")
      : !modes.draft && !modes.direct
        ? t("Falta un permiso: vuelve a conectar TikTok para autorizar la publicación.", "A permission is missing: reconnect TikTok to authorize posting.")
        : null;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Publicar en TikTok", "Post to TikTok")}
        description={t(
          "Sube un video y publícalo en tu cuenta de TikTok, o mándalo como borrador a la app para terminarlo allá.",
          "Upload a video and post it to your TikTok account, or send it as a draft to the app to finish it there."
        )}
      />
      {blocker ? (
        <Card>
          <p className="text-sm font-semibold text-moss">{blocker}</p>
          <Link href="/admin/conectar" className="mt-sp-3 inline-block text-sm font-semibold text-coral hover:underline">
            {t("Ir a Conectar cuentas", "Go to Connect accounts")}
          </Link>
        </Card>
      ) : (
        <TikTokPublisher modes={modes} />
      )}
    </div>
  );
}
