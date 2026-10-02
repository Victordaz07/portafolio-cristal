"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastContext";
import { accentLinkClass } from "@/lib/admin-ui";
import {
  CONTENT_TYPE_LABEL,
  NETWORK_META,
  POST_STATUS_LABEL,
  formatTime,
  isPlanNetwork,
  type ContentType,
} from "@/lib/content-plan";
import { addDays, formatDateKey, weekStartOf } from "@/lib/growth";
import type { PostView } from "@/lib/posts-view";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const eyebrowClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

function NetworkBadges({ networks }: { networks: string[] }) {
  return (
    <span className="flex shrink-0 gap-1">
      {networks.filter(isPlanNetwork).map((n) => (
        <span
          key={n}
          className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-[6px] px-1 font-mono text-[8px] font-bold ${NETWORK_META[n].badge}`}
        >
          {NETWORK_META[n].initials}
        </span>
      ))}
    </span>
  );
}

export default function CalendarView({
  month,
  prevMonth,
  nextMonth,
  today,
  posts,
  upcoming,
  overdue,
}: {
  month: string;
  prevMonth: string;
  nextMonth: string;
  today: string;
  posts: PostView[];
  upcoming: PostView[];
  overdue: PostView[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string | null>(month === today.slice(0, 7) ? today : null);
  const [deleting, setDeleting] = useState<PostView | null>(null);

  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = `${month}-01`;
  const gridStart = weekStartOf(firstDay);
  const lastDay = addDays(`${nextMonth}-01`, -1);
  const gridEnd = addDays(weekStartOf(lastDay), 6);
  const days: string[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const postsByDay = new Map<string, PostView[]>();
  for (const post of posts) postsByDay.set(post.dateKey, [...(postsByDay.get(post.dateKey) ?? []), post]);
  const selectedPosts = selectedDay ? postsByDay.get(selectedDay) ?? [] : [];

  async function markPublished(post: PostView) {
    const response = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    if (!response.ok) return showToast("error", "No se pudo actualizar");
    showToast("success", "¡Marcada como publicada!");
    router.refresh();
  }

  async function remove(post: PostView) {
    setDeleting(null);
    const response = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    if (!response.ok) return showToast("error", "No se pudo borrar");
    showToast("success", "Publicación borrada");
    router.refresh();
  }

  function PostRow({ post, showDate = true }: { post: PostView; showDate?: boolean }) {
    const published = post.status === "published";
    return (
      <li className="flex flex-wrap items-center gap-sp-3 border-b border-line py-2.5 last:border-0">
        <NetworkBadges networks={post.networks} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[13px] font-semibold ${published ? "text-ink/50 line-through" : "text-ink"}`}>
            {post.caption.split("\n")[0] || "(sin texto)"}
          </p>
          <p className="truncate text-xs text-ink/55">
            {[
              CONTENT_TYPE_LABEL[post.contentType as ContentType] ?? post.contentType,
              post.brandName,
              POST_STATUS_LABEL[post.status],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className="shrink-0 text-xs text-ink/55">
          {showDate ? `${formatDateKey(post.dateKey, false)} · ` : ""}
          {formatTime(post.time)}
        </span>
        <span className="flex shrink-0 gap-sp-3">
          {!published && (
            <button type="button" onClick={() => markPublished(post)} className="text-xs font-semibold text-cobalt hover:underline">
              Marcar publicada
            </button>
          )}
          <Link href={`/admin/crear?id=${post.id}`} className={`${accentLinkClass} text-xs`}>
            Editar
          </Link>
          <button type="button" onClick={() => setDeleting(post)} className="text-xs text-ink/40 hover:text-ink">
            Borrar
          </button>
        </span>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-sp-5">
      {overdue.length > 0 && (
        <Card className="border-coral/40">
          <p className={`${eyebrowClass} mb-sp-2`}>¿Ya las publicaste?</p>
          <p className="mb-sp-2 text-[13px] text-ink/60">
            Estas publicaciones ya pasaron su fecha. Márcalas como publicadas o cámbiales la fecha.
          </p>
          <ul>
            {overdue.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </ul>
        </Card>
      )}

      <div className="grid items-start gap-sp-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-sp-4 flex items-center justify-between gap-sp-3">
            <Link href={`/admin/calendario?month=${prevMonth}`} className="rounded-full border border-line px-3 py-1 text-sm hover:border-coral" aria-label="Mes anterior">
              ←
            </Link>
            <p className="font-fraunces text-xl font-semibold text-ink">
              {MONTH_NAMES[monthIndex - 1]} {year}
            </p>
            <Link href={`/admin/calendario?month=${nextMonth}`} className="rounded-full border border-line px-3 py-1 text-sm hover:border-coral" aria-label="Mes siguiente">
              →
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <p key={d} className="pb-sp-1 font-mono text-[10px] uppercase text-ink/50">
                {d}
              </p>
            ))}
            {days.map((day) => {
              const inMonth = day.startsWith(month);
              const dayPosts = postsByDay.get(day) ?? [];
              const networks = Array.from(new Set(dayPosts.flatMap((p) => p.networks))).filter(isPlanNetwork);
              const isToday = day === today;
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-[54px] flex-col items-center gap-1 rounded-[10px] border p-1 text-[13px] transition sm:min-h-[64px] ${
                    isSelected
                      ? "border-ink bg-ink text-cream"
                      : isToday
                        ? "border-coral bg-coral/10 text-ink"
                        : inMonth
                          ? "border-line bg-white text-ink hover:border-coral/50"
                          : "border-transparent bg-transparent text-ink/30"
                  }`}
                >
                  <span className={isToday && !isSelected ? "font-bold text-coral" : ""}>{Number(day.slice(8))}</span>
                  <span className="flex flex-wrap justify-center gap-0.5">
                    {networks.slice(0, 4).map((n) => (
                      <span key={n} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-lime" : NETWORK_META[n].dot}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-sp-3 flex flex-wrap gap-sp-3 text-[11px] text-ink/55">
            {Object.values(NETWORK_META).map((meta) => (
              <span key={meta.label} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} /> {meta.label}
              </span>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-sp-4">
          <Card>
            <div className="mb-sp-2 flex items-center justify-between gap-sp-3">
              <p className={eyebrowClass}>{selectedDay ? formatDateKey(selectedDay) : "Elige un día"}</p>
              {selectedDay && (
                <Link href={`/admin/crear?date=${selectedDay}`} className={`${accentLinkClass} text-xs`}>
                  + Programar este día
                </Link>
              )}
            </div>
            {selectedDay && selectedPosts.length === 0 && (
              <p className="text-sm text-ink/60">Nada programado este día.</p>
            )}
            <ul>
              {selectedPosts.map((post) => (
                <PostRow key={post.id} post={post} showDate={false} />
              ))}
            </ul>
          </Card>

          <Card>
            <p className={`${eyebrowClass} mb-sp-2`}>Próximas publicaciones</p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink/60">
                No hay nada programado.{" "}
                <Link href="/admin/crear" className={accentLinkClass}>
                  Crea tu próxima publicación
                </Link>
              </p>
            ) : (
              <ul>
                {upcoming.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Borrar publicación"
          description="¿Seguro que quieres borrar esta publicación del calendario?"
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
