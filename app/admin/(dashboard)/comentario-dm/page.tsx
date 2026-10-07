import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { DAILY_DM_CAP, DM_SCOPE, dmEnabled } from "@/lib/comment-trigger";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import CommentTriggerManager from "./CommentTriggerManager";

export const dynamic = "force-dynamic";

export default async function CommentDmPage() {
  const { t } = await getT();
  const [account, triggers] = await Promise.all([
    prisma.socialAccount.findFirst({ where: { platform: "instagram" }, select: { username: true, scopes: true } }),
    prisma.commentTrigger.findMany({ orderBy: { createdAt: "desc" }, include: { hits: { select: { status: true } } } }),
  ]);
  const enabled = dmEnabled();
  const hasScope = Boolean(account?.scopes.includes(DM_SCOPE));

  const status: { tone: "ok" | "warn" | "wait"; text: string; link?: { href: string; label: string } } = !account
    ? { tone: "warn", text: t("Primero conecta tu Instagram.", "Connect your Instagram first."), link: { href: "/admin/conectar", label: t("Ir a Conectar cuentas", "Go to Connect accounts") } }
    : !enabled
      ? {
          tone: "wait",
          text: t(
            "Puedes dejar tus reglas listas, pero los mensajes no se envían todavía: Instagram tiene que aprobar el permiso de mensajes de Foliocrew. Te avisaremos cuando esté activo.",
            "You can get your rules ready, but messages aren't sent yet: Instagram has to approve Foliocrew's messaging permission. We'll let you know when it's active."
          ),
        }
      : !hasScope
        ? { tone: "warn", text: t("Falta un permiso: vuelve a conectar Instagram para autorizar los mensajes.", "A permission is missing: reconnect Instagram to authorize messages."), link: { href: "/admin/conectar", label: t("Reconectar Instagram", "Reconnect Instagram") } }
        : { tone: "ok", text: t("Activo: cuando alguien comente la palabra, le llega tu mensaje por DM.", "Active: when someone comments the word, they get your message by DM.") };

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Comentario → DM", "Comment → DM")}
        description={t(
          "Elige una publicación y una palabra (por ejemplo «LINK»). Cuando alguien la comente, Foliocrew le manda tu mensaje por DM, una sola vez por persona.",
          "Pick a post and a word (for example “LINK”). When someone comments it, Foliocrew sends them your message by DM, once per person."
        )}
      />
      <Card>
        <p className={`text-sm ${status.tone === "ok" ? "text-moss" : status.tone === "warn" ? "text-coral" : "text-ink/70"}`}>{status.text}</p>
        {status.link && (
          <Link href={status.link.href} className="mt-sp-2 inline-block text-sm font-semibold text-coral hover:underline">
            {status.link.label}
          </Link>
        )}
        <ul className="mt-sp-3 list-disc pl-sp-5 text-xs text-ink/60">
          <li>{t("Solo se le escribe a quien comentó, dentro de los 7 días siguientes al comentario.", "Only the person who commented gets a message, within 7 days of the comment.")}</li>
          <li>{t(`Máximo ${DAILY_DM_CAP} mensajes automáticos por día.`, `Up to ${DAILY_DM_CAP} automatic messages per day.`)}</li>
          <li>{t("Escribe mensajes que la persona espera (el enlace o la guía que pidió): nada de publicidad sorpresa.", "Write messages the person expects (the link or guide they asked for): no surprise ads.")}</li>
        </ul>
      </Card>
      <CommentTriggerManager
        connected={Boolean(account)}
        rules={triggers.map((r) => ({
          id: r.id,
          mediaId: r.mediaId,
          mediaLabel: r.mediaLabel,
          keyword: r.keyword,
          message: r.message,
          active: r.active,
          sent: r.hits.filter((h) => h.status === "sent").length,
          waiting: r.hits.filter((h) => h.status === "skipped").length,
          failed: r.hits.filter((h) => h.status === "failed").length,
        }))}
      />
    </div>
  );
}
