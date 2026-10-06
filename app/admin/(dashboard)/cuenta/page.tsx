import { prisma, prismaRoot } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/tenant";
import { sessionCreatorSite } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountForm from "./AccountForm";
import CreatorKindPicker from "./CreatorKindPicker";
import { creatorKind } from "@/lib/creator-kind";
import { emailConfigured } from "@/lib/email";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import ShareInsightsButton from "@/components/admin/ShareInsightsButton";
import DataRequestForm from "./DataRequestForm";
import { DATA_REQUEST_STATUS, dataRequestKindLabel } from "@/lib/data-export";
import { getT } from "@/lib/admin-lang-server";
import { dateLocale, pickLabel, type AdminLang, type T } from "@/lib/admin-lang";

const fmtDateIn = (d: Date, lang: AdminLang) => d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** "Motivo: Ticket #3: …" → "Ticket #3: …" (el registro guarda el motivo de cada acceso). */
const accessReason = (detail: string | null, t: T) => (detail?.startsWith("Motivo: ") ? detail.slice(8) : t("Ayuda de soporte", "Support help"));

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ correo?: string }> }) {
  const { correo } = await searchParams;
  const { t, lang } = await getT();
  const fmtDate = (d: Date) => fmtDateIn(d, lang);
  const session = await getSession();
  const [user, creator] = session
    ? await Promise.all([
        prisma.adminUser.findUnique({ where: { id: session.userId }, select: { name: true, email: true, emailVerifiedAt: true } }),
        prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true, slug: true, customDomain: true, shareInsights: true, shareInsightsAt: true, creatorKind: true } }),
      ])
    : [null, null];
  const siteUrl = (await sessionCreatorSite())?.url ?? "";
  const [dataRequests, teamAccess] = session
    ? await Promise.all([
        prisma.dataRequest.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
        prismaRoot.platformAction.findMany({
          where: { creatorId: session.creatorId, action: { in: ["impersonate", "data-export"] } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow={t("Ayuda", "Help")} title={t("Mi cuenta", "My account")} description={t("Tus datos de acceso y la dirección de tu sitio.", "Your sign-in details and your site address.")} />
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tu sitio", "Your site")}</p>
        <p className="font-mono text-sm text-ink">{siteUrl.replace("https://", "")}</p>
        <p className="mt-sp-1 text-xs text-ink/55">
          {t("Para conectar tu propio dominio o ver tus otras direcciones, ve a", "To connect your own domain or see your other addresses, go to")}{" "}
          <Link href="/admin/dominio" className="font-semibold text-coral hover:underline">
            {t("Mi dominio", "My domain")}
          </Link>
          .
        </p>
      </Card>
      {correo === "confirmado" && (
        <Card>
          <p role="status" className="text-sm text-ink">
            ✅ <strong>{t("Correo confirmado.", "Email confirmed.")}</strong> {t("Te avisaremos aquí cuando una marca te escriba.", "We'll let you know here when a brand writes to you.")}
          </p>
        </Card>
      )}
      {correo === "vencido" && (
        <Card>
          <p role="alert" className="text-sm text-ink">
            {t("Ese enlace venció o ya se usó.", "That link expired or was already used.")}
            {user?.emailVerifiedAt
              ? t(" Tu correo ya está confirmado.", " Your email is already confirmed.")
              : t(" Pide uno nuevo con el botón de arriba.", " Request a new one with the button above.")}
          </p>
        </Card>
      )}
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Correo de la cuenta", "Account email")}</p>
        <p className="text-sm text-ink">
          <span className="font-mono">{user?.email}</span>{" "}
          {user?.emailVerifiedAt ? (
            <span className="ml-1 rounded-full bg-sage/30 px-[8px] py-0.5 font-mono text-[10px] uppercase text-cobalt-ink">{t("Confirmado", "Confirmed")}</span>
          ) : (
            <span className="ml-1 rounded-full bg-cream px-[8px] py-0.5 font-mono text-[10px] uppercase text-ink/60">{t("Sin confirmar", "Unconfirmed")}</span>
          )}
        </p>
        {!emailConfigured() && (
          <p className="mt-sp-1 text-xs text-ink/55">{t("Los correos automáticos todavía no están activos en Foliocrew.", "Automatic emails aren't active on Foliocrew yet.")}</p>
        )}
      </Card>
      {creator && <CreatorKindPicker initial={creatorKind(creator.creatorKind)} />}
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Inteligencia Foliocrew", "Foliocrew Intelligence")}</p>
        <p className="text-sm text-ink">
          {creator?.shareInsights
            ? t(
                `Participas desde el ${creator.shareInsightsAt?.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) ?? "inicio"}. Tus métricas cuentan de forma anónima y agregada, y ves la comparativa de tu nicho en Reportes.`,
                `You've been participating since ${creator.shareInsightsAt?.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) ?? "the start"}. Your metrics count anonymously and in aggregate, and you see your niche comparison in Reports.`
              )
            : t(
                "No participas. Si te sumas, ves qué funciona en tu nicho (horarios, formatos, ganchos) y tus métricas ayudan, de forma anónima, a los demás.",
                "You're not participating. If you join, you see what works in your niche (times, formats, hooks) and your metrics anonymously help others."
              )}
        </p>
        <p className="mt-sp-1 text-xs text-ink/55">
          {t("Nunca se muestra tu nombre, usuario ni marcas. Más detalles en la", "Your name, username and brands are never shown. More details in the")}{" "}
          <Link href={lang === "en" ? "/privacidad?lang=en" : "/privacidad"} className="font-semibold text-coral hover:underline">
            {t("política de privacidad", "privacy policy")}
          </Link>
          .
        </p>
        <div className="mt-sp-3">
          {creator?.shareInsights ? (
            <ShareInsightsButton share={false} label={t("Dejar de participar", "Stop participating")} variant="ghost" />
          ) : (
            <ShareInsightsButton share label={t("Sumarme", "Join")} />
          )}
        </div>
      </Card>
      <Card>
        <div id="datos" className="scroll-mt-sp-6" />
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tus datos", "Your data")}</p>
        {session?.actorId ? (
          <p className="text-sm text-ink/70">
            {t("Mientras el equipo ayuda en esta cuenta, la descarga y los pedidos de datos no están disponibles.", "While the team is helping on this account, data downloads and requests aren't available.")}
          </p>
        ) : (
          <DataRequestForm />
        )}
        {dataRequests.length > 0 && (
          <ul className="mt-sp-4 flex flex-col gap-sp-2 border-t border-line pt-sp-4 text-sm">
            {dataRequests.map((r) => {
              const status = DATA_REQUEST_STATUS[r.status] ?? DATA_REQUEST_STATUS.open;
              return (
                <li key={r.id} className="flex flex-col gap-sp-1">
                  <div className="flex flex-wrap items-center gap-sp-2">
                    <span className="font-semibold text-ink">{dataRequestKindLabel(r.kind, lang)}</span>
                    <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${status.tone}`}>{pickLabel(lang, status)}</span>
                    <span className="font-mono text-xs text-ink/50">{fmtDate(r.createdAt)}</span>
                  </div>
                  {r.resolution && <p className="text-ink/70">💬 {r.resolution}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Accesos del equipo de Foliocrew", "Foliocrew team access")}</p>
        <p className="text-sm text-ink/70">
          {t(
            "Cada vez que alguien del equipo entra a tu cuenta para ayudarte (o saca una copia de tus datos) queda anotado aquí, con el motivo.",
            "Every time someone from the team signs in to your account to help you (or exports a copy of your data), it's logged here with the reason."
          )}
        </p>
        {teamAccess.length === 0 ? (
          <p className="mt-sp-2 text-sm text-ink/60">{t("Nadie del equipo ha entrado a tu cuenta.", "Nobody from the team has signed in to your account.")}</p>
        ) : (
          <ul className="mt-sp-3 flex flex-col gap-sp-2 text-sm">
            {teamAccess.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-sp-2 border-t border-line pt-sp-2 first:border-0 first:pt-0">
                <span className="font-mono text-xs text-ink/50">{fmtDate(a.createdAt)}</span>
                <span className="font-semibold text-ink">{a.actorEmail}</span>
                <span className="text-ink/70">
                  {a.action === "data-export"
                    ? t("Sacó una copia de tus datos", "Exported a copy of your data")
                    : `${t("Entró a tu cuenta", "Signed in to your account")} · ${accessReason(a.detail, t)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <AccountForm
        initialName={user?.name ?? creator?.name ?? ""}
        email={user?.email ?? ""}
        isPlatformAdmin={user ? isPlatformAdminEmail(user.email) : false}
        impersonating={Boolean(session?.actorId)}
      />
    </div>
  );
}
