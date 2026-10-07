import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { SESSION_KINDS } from "@/lib/circles";
import { sessionsFor } from "@/lib/circles-server";
import { pick } from "@/lib/i18n";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import SessionActions from "./SessionActions";

export const dynamic = "force-dynamic";

/** Sesiones en vivo y mentorías grupales (E7). El enlace de la videollamada solo lo ve quien reservó. */
export default async function SessionsPage() {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const sessions = await sessionsFor(session.creatorId);
  const when = (d: Date) => d.toLocaleString(lang === "en" ? "en-US" : "es-US", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: process.env.APP_TIMEZONE || "America/New_York" });
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("Sesiones en vivo", "Live sessions")}
        description={t("Charlas y mentorías en grupo con creadoras con experiencia. Reserva tu lugar y recibe el enlace. Algunas son exclusivas del plan Crew.", "Talks and group mentoring with experienced creators. Book your spot and get the link. Some are exclusive to the Crew plan.")}
      />
      {sessions.length === 0 ? (
        <Card><p className="text-sm text-ink/60">{t("No hay sesiones programadas por ahora. Pronto habrá nuevas.", "There are no sessions scheduled right now. New ones are coming soon.")}</p></Card>
      ) : (
        <div className="grid gap-sp-3 lg:grid-cols-2">
          {sessions.map((s) => (
            <Card key={s.id} className={s.phase === "canceled" || s.phase === "ended" ? "opacity-60" : ""}>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral">
                {SESSION_KINDS.find((k) => k.id === s.kind)?.[lang === "en" ? "labelEn" : "label"]}
                {s.crewOnly ? " · Crew" : ""}
                {s.phase === "live" ? ` · ${t("¡en vivo!", "live now!")}` : s.phase === "canceled" ? ` · ${t("cancelada", "canceled")}` : s.phase === "ended" ? ` · ${t("terminada", "ended")}` : ""}
              </p>
              <h2 className="font-fraunces text-xl font-medium text-ink">{pick(lang, s.title, s.titleEn)}</h2>
              <p className="text-xs text-ink/60">{when(s.startsAt)} · {s.durationMin} min · {t("con", "with")} {s.hostName}{s.circle ? ` · ${pick(lang, s.circle.name, s.circle.nameEn)}` : ""}</p>
              {s.description && <p className="mt-sp-2 text-sm text-ink/70">{pick(lang, s.description, s.descriptionEn)}</p>}
              <p className="mt-sp-2 text-xs text-ink/50">{s.capacity ? t(`${s.taken} de ${s.capacity} lugares`, `${s.taken} of ${s.capacity} spots`) : t(`${s.taken} reservaron`, `${s.taken} booked`)}</p>
              <SessionActions id={s.id} phase={s.phase} reserved={s.reserved} allowed={s.allowed} full={s.capacity != null && s.taken >= s.capacity && !s.reserved} joinUrl={s.joinUrl} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
