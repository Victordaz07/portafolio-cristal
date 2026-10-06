import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { hasRole, teamUser } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";
import { findTarget } from "@/lib/community-moderation";
import { reportReasonLabel, timeAgo } from "@/lib/community";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { plural } from "@/lib/admin-lang";
import ModerationActions from "./ModerationActions";
import WeeklyQuestionButton from "./WeeklyQuestionButton";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, [string, string]> = {
  post: ["Publicación", "Post"],
  reply: ["Respuesta", "Reply"],
  profile: ["Perfil", "Profile"],
};

/** Departamento de Comunidad: reportes abiertos agrupados por contenido, con sus acciones. */
export default async function CommunityModerationPage() {
  const { t, lang } = await getT();
  const user = await teamUser();
  if (!hasRole(user, "community")) notFound();

  const [open, resolved, muted] = await Promise.all([
    prismaRoot.communityReport.findMany({ where: { status: "open" }, orderBy: { createdAt: "asc" }, take: 300 }),
    prismaRoot.communityReport.findMany({ where: { status: { not: "open" } }, orderBy: { resolvedAt: "desc" }, take: 20 }),
    prismaRoot.communityProfile.findMany({
      where: { mutedUntil: { gt: new Date() } },
      select: { displayName: true, mutedUntil: true, creator: { select: { slug: true } } },
      orderBy: { mutedUntil: "desc" },
    }),
  ]);

  // Un grupo por contenido reportado.
  const groups = new Map<string, typeof open>();
  for (const r of open) groups.set(`${r.targetType}:${r.targetId}`, [...(groups.get(`${r.targetType}:${r.targetId}`) ?? []), r]);
  const items = await Promise.all(
    Array.from(groups.values()).map(async (reports) => {
      const first = reports[0];
      const target = await findTarget(first.targetType as "post" | "reply" | "profile", first.targetId);
      const author = target
        ? await prismaRoot.creator.findUnique({ where: { id: target.creatorId }, select: { slug: true, communityProfile: { select: { displayName: true, mutedUntil: true } } } })
        : null;
      return { reports, target, author };
    })
  );
  // Primero lo más reportado y las posibles estafas.
  items.sort((a, b) => Number(b.reports.some((r) => r.reason === "estafa")) - Number(a.reports.some((r) => r.reason === "estafa")) || b.reports.length - a.reports.length);
  const type = (k: string) => (lang === "en" ? TYPE_LABEL[k]?.[1] : TYPE_LABEL[k]?.[0]) ?? k;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Equipo Foliocrew", "Foliocrew team")}
        title={t("🛡️ Comunidad", "🛡️ Community")}
        description={t(
          "Reportes de la comunidad. Ocultar avisa a la persona por correo; con 5 reportes el contenido se oculta solo hasta que lo revises. Todo queda en el historial del Centro de mando.",
          "Community reports. Hiding notifies the person by email; with 5 reports the content hides itself until you review it. Everything is logged in the Command center history."
        )}
        action={<WeeklyQuestionButton />}
      />

      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">
        {items.length} {plural(lang, items.length, ["contenido por revisar", "contenidos por revisar"], ["item to review", "items to review"])}
      </p>
      {items.length === 0 && <Card className="text-sm text-ink/60">{t("No hay reportes abiertos. 🎉", "No open reports. 🎉")}</Card>}
      {items.map(({ reports, target, author }) => {
        const first = reports[0];
        const scam = reports.some((r) => r.reason === "estafa");
        return (
          <Card key={first.id} className={`flex flex-col gap-sp-3 ${scam ? "border-red-300" : ""}`}>
            <div className="flex flex-wrap items-center gap-sp-2 text-xs">
              <span className="rounded-full bg-ink px-sp-2 py-0.5 font-mono uppercase text-cream">{type(first.targetType)}</span>
              <span className="rounded-full bg-coral/15 px-sp-2 py-0.5 font-semibold text-coral">
                {reports.length} {reports.length === 1 ? t("reporte", "report") : t("reportes", "reports")}
              </span>
              {scam && <span className="rounded-full bg-red-100 px-sp-2 py-0.5 font-semibold text-red-700">{t("⚠ Posible estafa", "⚠ Possible scam")}</span>}
              {target?.hidden && <span className="rounded-full bg-cream px-sp-2 py-0.5 text-ink/60">{t("Oculto", "Hidden")}</span>}
              {author?.communityProfile?.mutedUntil && author.communityProfile.mutedUntil > new Date() && (
                <span className="rounded-full bg-cream px-sp-2 py-0.5 text-ink/60">{t("Cuenta en pausa", "Account paused")}</span>
              )}
              <span className="ml-auto text-ink/45">{timeAgo(first.createdAt, lang)}</span>
            </div>
            {target ? (
              <>
                <p className="whitespace-pre-line rounded-[12px] bg-cream p-sp-3 text-sm text-ink">{target.summary}</p>
                <p className="text-xs text-ink/60">
                  {t("De", "By")}{" "}
                  {author && (
                    <Link href={`/admin/comunidad/creador/${author.slug}`} className="font-semibold text-ink hover:text-coral">
                      {author.communityProfile?.displayName} @{author.slug}
                    </Link>
                  )}
                  {target.postId && (
                    <>
                      {" · "}
                      <Link href={`/admin/comunidad/${target.postId}`} className="text-coral hover:underline">
                        {t("ver en el muro", "view on the wall")}
                      </Link>
                    </>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink/55">{t("El contenido ya se borró.", "The content was already deleted.")}</p>
            )}
            <ul className="flex flex-col gap-1 text-xs text-ink/70">
              {reports.map((r) => (
                <li key={r.id}>
                  • <strong>{reportReasonLabel(r.reason, lang)}</strong>
                  {r.detail ? ` — ${r.detail}` : ""} <span className="text-ink/40">({timeAgo(r.createdAt, lang)})</span>
                </li>
              ))}
            </ul>
            <ModerationActions reportId={first.id} canHide={Boolean(target) && first.targetType !== "profile"} hidden={Boolean(target?.hidden)} />
          </Card>
        );
      })}

      <div className="grid gap-sp-4 md:grid-cols-2">
        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cuentas en pausa", "Paused accounts")}</p>
          {muted.length === 0 ? (
            <p className="text-sm text-ink/55">{t("Ninguna.", "None.")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {muted.map((m) => (
                <li key={m.creator.slug}>
                  {m.displayName} <span className="text-ink/45">@{m.creator.slug}</span> ·{" "}
                  <span className="text-xs text-ink/55">
                    {t("hasta", "until")} {m.mutedUntil!.toLocaleDateString(lang === "en" ? "en-US" : "es", { day: "numeric", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Resueltos hace poco", "Recently resolved")}</p>
          {resolved.length === 0 ? (
            <p className="text-sm text-ink/55">{t("Todavía nada.", "Nothing yet.")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-xs text-ink/70">
              {resolved.map((r) => (
                <li key={r.id}>
                  {type(r.targetType)} · {reportReasonLabel(r.reason, lang)} ·{" "}
                  <strong>{r.status === "actioned" ? t("con acción", "actioned") : t("descartado", "dismissed")}</strong> · {r.handledBy}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
