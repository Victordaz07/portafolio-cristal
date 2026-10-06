import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { appTimeZone, todayKey } from "@/lib/growth-server";
import { zonedToUtc } from "@/lib/content-plan";
import { toPostView } from "@/lib/posts-view";
import CalendarView from "./CalendarView";
import { getT } from "@/lib/admin-lang-server";

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const { t } = await getT();
  const tz = appTimeZone();
  const today = todayKey();
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today.slice(0, 7);
  const start = zonedToUtc(`${month}-01`, "00:00", tz);
  const end = zonedToUtc(`${shiftMonth(month, 1)}-01`, "00:00", tz);
  const now = new Date();

  const [monthPosts, upcoming, overdue] = await Promise.all([
    prisma.scheduledPost.findMany({
      where: { scheduledFor: { gte: start, lt: end } },
      orderBy: { scheduledFor: "asc" },
      include: { brand: { select: { name: true } } },
    }),
    prisma.scheduledPost.findMany({
      where: { scheduledFor: { gte: now }, status: { not: "published" } },
      orderBy: { scheduledFor: "asc" },
      take: 8,
      include: { brand: { select: { name: true } } },
    }),
    prisma.scheduledPost.findMany({
      where: { scheduledFor: { lt: now }, status: "scheduled" },
      orderBy: { scheduledFor: "desc" },
      take: 8,
      include: { brand: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={t("Contenido", "Content")}
        title={t("Calendario", "Calendar")}
        description={t(
          "Tu plan de publicaciones del mes. Por ahora el panel te recuerda qué publicar; la publicación automática llega cuando las redes aprueben la app.",
          "Your posting plan for the month. For now the dashboard reminds you what to post; automatic publishing arrives once the networks approve the app."
        )}
        action={
          <Link
            href="/admin/crear"
            className="inline-flex rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white transition hover:bg-moss"
          >
            {t("+ Programar publicación", "+ Schedule post")}
          </Link>
        }
      />
      <CalendarView
        month={month}
        prevMonth={shiftMonth(month, -1)}
        nextMonth={shiftMonth(month, 1)}
        today={today}
        posts={monthPosts.map((p) => toPostView(p, tz))}
        upcoming={upcoming.map((p) => toPostView(p, tz))}
        overdue={overdue.map((p) => toPostView(p, tz))}
      />
    </div>
  );
}
