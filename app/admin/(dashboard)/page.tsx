import Link from "next/link";
import { redirect } from "next/navigation";
import SetupChecklist from "@/components/admin/SetupChecklist";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import {
  PAYMENT_STATUS_META,
  isPaymentStatus,
  daysUntil,
  dueLabel,
  formatMoney,
} from "@/lib/crm";
import { weekStartOf } from "@/lib/growth";
import { appTimeZone, getActivityStreak, todayKey } from "@/lib/growth-server";
import { NETWORK_META, formatTime, isPlanNetwork, utcToZoned } from "@/lib/content-plan";
import { pickLabel, type T } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

// Iniciales y color por red, igual que en el diseño del panel v2.
const PLATFORM_META: Record<string, { initials: string; className: string }> = {
  instagram: { initials: "IG", className: "bg-coral text-white" },
  tiktok: { initials: "TK", className: "bg-ink text-white" },
  facebook: { initials: "FB", className: "bg-moss text-white" },
  ugc: { initials: "📷", className: "bg-lime text-ink" },
};

function timeAgo(date: Date, t: T) {
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return t("hace un momento", "just now");
  if (hours < 24) return t(`hace ${hours}h`, `${hours}h ago`);
  return t(`hace ${Math.floor(hours / 24)}d`, `${Math.floor(hours / 24)}d ago`);
}

function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-sp-3 flex items-center justify-between gap-sp-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{children}</p>
      {aside}
    </div>
  );
}

export default async function AdminHomePage() {
  const { t, lang } = await getT();
  // Las creadoras nuevas empiezan por el asistente de bienvenida.
  const session = await getSession();
  const creator = session
    ? await prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { onboardedAt: true } })
    : null;
  if (creator && !creator.onboardedAt) redirect("/admin/bienvenida");

  const [
    unreadMessages,
    pendingMessages,
    latestCards,
    stats,
    deals,
    weekActions,
    streak,
    upcomingPosts,
    scheduledCount,
  ] = await Promise.all([
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.contactMessage.findMany({
      where: { read: false },
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    prisma.contentCard.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { brand: { select: { name: true } } },
    }),
    prisma.stat.findMany({ orderBy: { order: "asc" }, take: 3 }),
    prisma.brand.findMany({
      where: { dealStatus: { not: null } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        dealStatus: true,
        dealValue: true,
        paymentStatus: true,
        nextAction: true,
        nextActionDue: true,
      },
    }),
    prisma.actionItem.findMany({ where: { weekStart: weekStartOf(todayKey()) }, select: { done: true } }),
    getActivityStreak(),
    prisma.scheduledPost.findMany({
      where: { scheduledFor: { gte: new Date() }, status: { not: "published" } },
      orderBy: { scheduledFor: "asc" },
      take: 3,
      include: { brand: { select: { name: true } } },
    }),
    prisma.scheduledPost.count({ where: { scheduledFor: { gte: new Date() }, status: "scheduled" } }),
  ]);
  const tz = appTimeZone();

  const weekDone = weekActions.filter((a) => a.done).length;
  const weekPct = weekActions.length ? Math.round((weekDone / weekActions.length) * 100) : 0;

  const openDeals = deals.filter((d) => d.dealStatus === "active" || d.dealStatus === "negotiating");
  const followUps = deals
    .filter((d) => d.dealStatus !== "completed" && d.nextAction)
    .sort(
      (a, b) =>
        (a.nextActionDue?.getTime() ?? Infinity) - (b.nextActionDue?.getTime() ?? Infinity)
    );
  const overdueCount = followUps.filter((d) => d.nextActionDue && daysUntil(d.nextActionDue) < 0).length;
  const payments = deals.filter((d) => isPaymentStatus(d.paymentStatus));

  const kpis = [
    { label: t("Publicaciones programadas", "Scheduled posts"), value: scheduledCount, href: "/admin/calendario" },
    {
      label: t("Tratos activos", "Active deals"),
      value: deals.filter((d) => d.dealStatus === "active").length,
      href: "/admin/marcas",
    },
    { label: t("Mensajes sin leer", "Unread messages"), value: unreadMessages, href: "/admin/mensajes" },
    { label: t("Seguimientos pendientes", "Pending follow-ups"), value: followUps.length, href: "/admin/marcas" },
    {
      label: t("Valor en tratos abiertos", "Value in open deals"),
      value: formatMoney(openDeals.reduce((sum, d) => sum + (d.dealValue ?? 0), 0)),
      href: "/admin/marcas",
    },
  ];

  const quickActions = [
    { label: t("+ Nueva publicación", "+ New post"), href: "/admin/crear" },
    { label: t("+ Tarjeta en el Feed", "+ Feed card"), href: "/admin/feed" },
    { label: t("+ Agregar marca", "+ Add brand"), href: "/admin/marcas" },
    { label: t("Editar portada", "Edit cover"), href: "/admin/hero" },
  ];

  return (
    <div>
      <PageHeader eyebrow={t("Resumen", "Overview")} title={t("Tu panorama general", "Your big picture")} />

      <SetupChecklist />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-coral/30 hover:shadow-[0_8px_24px_rgba(36,18,39,0.08)]">
              <p className="font-fraunces text-3xl font-semibold text-coral">{kpi.value}</p>
              <p className="mt-sp-1 text-sm text-ink/70">{kpi.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-sp-5 grid gap-sp-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-sp-4">
          <Card>
            <SectionTitle
              aside={
                overdueCount > 0 && (
                  <span className="rounded-full bg-coral px-sp-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {overdueCount} {overdueCount === 1 ? t("atrasado", "overdue") : t("atrasados", "overdue")}
                  </span>
                )
              }
            >
              {t("Seguimientos pendientes", "Pending follow-ups")}
            </SectionTitle>
            {followUps.length === 0 ? (
              <p className="text-sm text-ink/60">
                {t("Sin pendientes. Agrega un “próximo paso” a tus tratos en Marcas para verlos aquí.", "Nothing pending. Add a “next step” to your deals in Brands to see them here.")}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {followUps.slice(0, 5).map((deal) => {
                  const overdue = deal.nextActionDue && daysUntil(deal.nextActionDue) < 0;
                  return (
                    <li key={deal.id}>
                      <Link
                        href="/admin/marcas"
                        className="flex items-center justify-between gap-sp-3 py-2.5 hover:opacity-80"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{deal.name}</p>
                          <p className="truncate text-xs text-ink/60">{deal.nextAction}</p>
                        </div>
                        {deal.nextActionDue && (
                          <span
                            className={`shrink-0 rounded-full px-sp-2 py-0.5 text-[11px] font-semibold ${
                              overdue ? "bg-coral/15 text-coral" : "bg-lime/30 text-ink"
                            }`}
                          >
                            {dueLabel(deal.nextActionDue, lang)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle
              aside={
                <Link href="/admin/calendario" className="text-xs font-semibold text-coral hover:underline">
                  {t("Ver calendario", "View calendar")}
                </Link>
              }
            >
              {t("Próximas publicaciones", "Upcoming posts")}
            </SectionTitle>
            {upcomingPosts.length === 0 ? (
              <p className="text-sm text-ink/60">
                {t("Nada programado.", "Nothing scheduled.")}{" "}
                <Link href="/admin/crear" className="font-medium text-coral hover:underline">
                  {t("Crea tu próxima publicación", "Create your next post")}
                </Link>
              </p>
            ) : (
              <ul className="flex flex-col gap-sp-3">
                {upcomingPosts.map((post) => {
                  const when = utcToZoned(post.scheduledFor, tz);
                  const first = post.networks.find(isPlanNetwork);
                  return (
                    <li key={post.id}>
                      <Link href={`/admin/crear?id=${post.id}`} className="flex items-center gap-sp-3 hover:opacity-80">
                        <span
                          className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] font-mono text-[9px] font-bold ${
                            first ? NETWORK_META[first].badge : "bg-lime text-ink"
                          }`}
                        >
                          {first ? NETWORK_META[first].initials : "·"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {post.caption.split("\n")[0] || t("(sin texto)", "(no text)")}
                          </p>
                          {post.brand && <p className="truncate text-xs text-ink/60">{post.brand.name}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-ink/50">
                          {Number(when.dateKey.slice(8))}/{Number(when.dateKey.slice(5, 7))} · {formatTime(when.time)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle
              aside={
                unreadMessages > 0 && (
                  <span className="rounded-full bg-coral px-sp-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {unreadMessages} {t("sin leer", "unread")}
                  </span>
                )
              }
            >
              {t("Mensajes por atender", "Messages to answer")}
            </SectionTitle>
            {pendingMessages.length === 0 ? (
              <p className="text-sm text-ink/60">{t("Estás al día: no hay mensajes sin leer.", "You're all caught up: no unread messages.")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {pendingMessages.map((message) => (
                  <li key={message.id}>
                    <Link
                      href="/admin/mensajes"
                      className="flex items-center justify-between gap-sp-3 py-2.5 hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{message.brand}</p>
                        <p className="truncate text-xs text-ink/60">
                          {message.name} · {message.collaborationType}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-coral/10 px-sp-2 py-0.5 text-[11px] font-semibold text-moss">
                        {timeAgo(message.createdAt, t)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>{t("Últimas publicaciones", "Latest posts")}</SectionTitle>
            {latestCards.length === 0 ? (
              <p className="text-sm text-ink/60">{t("Todavía no hay publicaciones en el feed.", "There are no posts in the feed yet.")}</p>
            ) : (
              <ul className="flex flex-col gap-sp-3">
                {latestCards.map((card) => {
                  const meta = PLATFORM_META[card.platform] ?? PLATFORM_META.ugc;
                  return (
                    <li key={card.id}>
                      <Link href="/admin/feed" className="flex items-center gap-sp-3 hover:opacity-80">
                        <span
                          className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] font-mono text-[9px] font-bold ${meta.className}`}
                        >
                          {meta.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{(lang === "en" && card.captionEn) || card.caption}</p>
                          {card.brand && (
                            <p className="truncate text-xs text-ink/60">{card.brand.name}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-ink/50">{(lang === "en" && card.categoryEn) || card.category}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-sp-4">
          <Link href="/admin/metas" className="rounded-[18px] bg-ink p-sp-5 text-cream transition hover:opacity-95">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime">{t("Racha y plan de la semana", "Streak & weekly plan")}</p>
            {weekActions.length === 0 ? (
              <p className="mt-sp-3 font-fraunces text-xl font-semibold">{t("Arma tu plan de esta semana →", "Build this week's plan →")}</p>
            ) : (
              <>
                <p className="mt-sp-3 font-fraunces text-2xl font-semibold">
                  {weekDone} / {weekActions.length} {t("tareas del plan listas", "plan tasks done")}
                </p>
                <div className="mt-sp-3 h-1.5 overflow-hidden rounded-full bg-cream/15">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${weekPct}%` }} />
                </div>
              </>
            )}
            <p className="mt-sp-3 text-xs text-cream/70">
              {streak > 0 ? t(`${streak} ${streak === 1 ? "día" : "días"} seguidos activa`, `${streak}-day active streak`) : t("Empieza tu racha hoy", "Start your streak today")}
            </p>
          </Link>

          <Link
            href="/admin/media-kit"
            className="rounded-[18px] bg-ink p-sp-5 text-cream transition hover:opacity-95"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime">
              {t("Tu media kit", "Your media kit")}
            </p>
            {stats.length === 0 ? (
              <p className="mt-sp-3 text-sm text-cream/70">{t("Agrega tus cifras en Media kit.", "Add your numbers in Media kit.")}</p>
            ) : (
              <div className="mt-sp-3 grid grid-cols-3 gap-sp-3">
                {stats.map((stat) => (
                  <div key={stat.id}>
                    <p className="font-fraunces text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-cream/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Link>

          <Card>
            <SectionTitle>{t("Pagos de marcas", "Brand payments")}</SectionTitle>
            {payments.length === 0 ? (
              <p className="text-sm text-ink/60">
                {t("Marca un trato como “Pendiente” o “Pagado” en Marcas para seguir tus cobros.", "Mark a deal as “Pending” or “Paid” in Brands to track your payments.")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {payments.map((deal) => {
                  const meta = isPaymentStatus(deal.paymentStatus)
                    ? PAYMENT_STATUS_META[deal.paymentStatus]
                    : null;
                  return (
                    <li key={deal.id}>
                      <Link
                        href="/admin/marcas"
                        className="flex items-center justify-between gap-sp-3 hover:opacity-80"
                      >
                        <span className="truncate text-[13px] font-semibold text-ink">{deal.name}</span>
                        <span className="flex shrink-0 items-center gap-sp-2">
                          {deal.dealValue != null && (
                            <span className="text-xs text-ink/55">{formatMoney(deal.dealValue)}</span>
                          )}
                          {meta && (
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.className}`}>
                              {pickLabel(lang, meta)}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>{t("Acciones rápidas", "Quick actions")}</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-[10px] border border-line px-3.5 py-2.5 text-[13px] text-ink transition hover:border-coral hover:text-coral"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
