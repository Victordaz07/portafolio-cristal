import Link from "next/link";
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

// Iniciales y color por red, igual que en el diseño del panel v2.
const PLATFORM_META: Record<string, { initials: string; className: string }> = {
  instagram: { initials: "IG", className: "bg-coral text-white" },
  tiktok: { initials: "TK", className: "bg-ink text-white" },
  facebook: { initials: "FB", className: "bg-moss text-white" },
  ugc: { initials: "UGC", className: "bg-lime text-ink" },
};

function timeAgo(date: Date) {
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "hace un momento";
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
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
    { label: "Publicaciones programadas", value: scheduledCount, href: "/admin/calendario" },
    {
      label: "Tratos activos",
      value: deals.filter((d) => d.dealStatus === "active").length,
      href: "/admin/marcas",
    },
    { label: "Mensajes sin leer", value: unreadMessages, href: "/admin/mensajes" },
    { label: "Seguimientos pendientes", value: followUps.length, href: "/admin/marcas" },
    {
      label: "Valor en tratos abiertos",
      value: formatMoney(openDeals.reduce((sum, d) => sum + (d.dealValue ?? 0), 0)),
      href: "/admin/marcas",
    },
  ];

  const quickActions = [
    { label: "+ Nueva publicación", href: "/admin/crear" },
    { label: "+ Tarjeta en el Feed", href: "/admin/feed" },
    { label: "+ Agregar marca", href: "/admin/marcas" },
    { label: "Editar portada", href: "/admin/hero" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Resumen" title="Tu panorama general" />

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
                    {overdueCount} {overdueCount === 1 ? "atrasado" : "atrasados"}
                  </span>
                )
              }
            >
              Seguimientos pendientes
            </SectionTitle>
            {followUps.length === 0 ? (
              <p className="text-sm text-ink/60">
                Sin pendientes. Agrega un “próximo paso” a tus tratos en Marcas para verlos aquí.
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
                            {dueLabel(deal.nextActionDue)}
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
                  Ver calendario
                </Link>
              }
            >
              Próximas publicaciones
            </SectionTitle>
            {upcomingPosts.length === 0 ? (
              <p className="text-sm text-ink/60">
                Nada programado.{" "}
                <Link href="/admin/crear" className="font-medium text-coral hover:underline">
                  Crea tu próxima publicación
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
                            {post.caption.split("\n")[0] || "(sin texto)"}
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
                    {unreadMessages} sin leer
                  </span>
                )
              }
            >
              Mensajes por atender
            </SectionTitle>
            {pendingMessages.length === 0 ? (
              <p className="text-sm text-ink/60">Estás al día: no hay mensajes sin leer.</p>
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
                        {timeAgo(message.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>Últimas publicaciones</SectionTitle>
            {latestCards.length === 0 ? (
              <p className="text-sm text-ink/60">Todavía no hay publicaciones en el feed.</p>
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
                          <p className="truncate text-sm font-semibold text-ink">{card.caption}</p>
                          {card.brand && (
                            <p className="truncate text-xs text-ink/60">{card.brand.name}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-ink/50">{card.category}</span>
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
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime">Racha y plan de la semana</p>
            {weekActions.length === 0 ? (
              <p className="mt-sp-3 font-fraunces text-xl font-semibold">Arma tu plan de esta semana →</p>
            ) : (
              <>
                <p className="mt-sp-3 font-fraunces text-2xl font-semibold">
                  {weekDone} / {weekActions.length} tareas del plan listas
                </p>
                <div className="mt-sp-3 h-1.5 overflow-hidden rounded-full bg-cream/15">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${weekPct}%` }} />
                </div>
              </>
            )}
            <p className="mt-sp-3 text-xs text-cream/70">
              {streak > 0 ? `${streak} ${streak === 1 ? "día" : "días"} seguidos activa` : "Empieza tu racha hoy"}
            </p>
          </Link>

          <Link
            href="/admin/media-kit"
            className="rounded-[18px] bg-ink p-sp-5 text-cream transition hover:opacity-95"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime">
              Tu media kit
            </p>
            {stats.length === 0 ? (
              <p className="mt-sp-3 text-sm text-cream/70">Agrega tus cifras en Media kit.</p>
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
            <SectionTitle>Pagos de marcas</SectionTitle>
            {payments.length === 0 ? (
              <p className="text-sm text-ink/60">
                Marca un trato como “Pendiente” o “Pagado” en Marcas para seguir tus cobros.
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
                              {meta.label}
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
            <SectionTitle>Acciones rápidas</SectionTitle>
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
