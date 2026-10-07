"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { CIRCLE_KINDS, SESSION_KINDS } from "@/lib/circles";

interface CircleRow { id: string; slug: string; name: string; kind: string; crewOnly: boolean; archived: boolean; members: number; messages: number; moderators: string[] }
interface SessionRow { id: string; kind: string; title: string; hostName: string; startsAt: string; durationMin: number; crewOnly: boolean; capacity: number | null; rsvps: number; canceled: boolean }

const label = "flex flex-col gap-sp-1 text-xs font-medium text-ink";
const eyebrow = "mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

export default function CirclesAdmin({ circles, sessions }: { circles: CircleRow[]; sessions: SessionRow[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [circle, setCircle] = useState({ name: "", kind: "niche", description: "", crewOnly: false });
  const [modFor, setModFor] = useState<Record<string, string>>({});
  const [session, setSession] = useState({ kind: "live", title: "", hostName: "", startsAt: "", durationMin: "60", joinUrl: "", capacity: "", description: "", crewOnly: false, circleId: "" });

  async function call(url: string, method: string, body: object, ok: string) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return false;
    }
    showToast("success", ok);
    router.refresh();
    return true;
  }

  async function createCircle(event: React.FormEvent) {
    event.preventDefault();
    if (await call("/api/admin/team/community/circles", "POST", circle, t("Círculo creado", "Circle created"))) setCircle({ name: "", kind: "niche", description: "", crewOnly: false });
  }

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    // El navegador da la hora local de quien programa: se manda como instante con zona horaria.
    const startsAt = session.startsAt ? new Date(session.startsAt).toISOString() : "";
    const body = { kind: session.kind, title: session.title, hostName: session.hostName, startsAt, durationMin: Number(session.durationMin), joinUrl: session.joinUrl, capacity: session.capacity ? Number(session.capacity) : null, description: session.description, crewOnly: session.crewOnly, circleId: session.circleId || null };
    if (await call("/api/admin/team/community/sessions", "POST", body, t("Sesión programada", "Session scheduled"))) setSession({ ...session, title: "", hostName: "", startsAt: "", joinUrl: "", capacity: "", description: "" });
  }

  return (
    <div className="flex flex-col gap-sp-6">
      <section>
        <p className={eyebrow}>{t("Nuevo círculo", "New circle")}</p>
        <form onSubmit={createCircle} className="grid gap-sp-3 sm:grid-cols-2">
          <label className={label}>{t("Nombre", "Name")}<input required maxLength={60} value={circle.name} onChange={(e) => setCircle({ ...circle, name: e.target.value })} className={inputClass} /></label>
          <label className={label}>{t("Tipo", "Type")}
            <select value={circle.kind} onChange={(e) => setCircle({ ...circle, kind: e.target.value })} className={inputClass}>
              {CIRCLE_KINDS.map((k) => <option key={k.id} value={k.id}>{lang === "en" ? k.labelEn : k.label}</option>)}
            </select>
          </label>
          <label className={`${label} sm:col-span-2`}>{t("Descripción", "Description")}<textarea rows={2} maxLength={500} value={circle.description} onChange={(e) => setCircle({ ...circle, description: e.target.value })} className={inputClass} /></label>
          <label className="flex items-center gap-sp-2 text-sm text-ink sm:col-span-2"><input type="checkbox" checked={circle.crewOnly} onChange={(e) => setCircle({ ...circle, crewOnly: e.target.checked })} />{t("Solo para el plan Crew", "Crew plan only")}</label>
          <button type="submit" disabled={busy || !circle.name.trim()} className={`${primaryButtonClass} sm:col-span-2`}>{t("Crear círculo", "Create circle")}</button>
        </form>
        {circles.length > 0 && (
          <ul className="mt-sp-4 flex flex-col divide-y divide-line border-t border-line">
            {circles.map((c) => (
              <li key={c.id} className="flex flex-col gap-sp-2 py-sp-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-sp-2">
                  <span className={c.archived ? "text-ink/40 line-through" : "font-semibold text-ink"}>{c.name}{c.crewOnly ? " · Crew" : ""} <span className="text-xs font-normal text-ink/50">/{c.slug} · {t(`${c.members} miembros`, `${c.members} members`)} · {t(`${c.messages} mensajes`, `${c.messages} messages`)}</span></span>
                  <span className="flex gap-sp-3 text-xs">
                    <button type="button" disabled={busy} onClick={() => call(`/api/admin/team/community/circles/${c.id}`, "PATCH", { crewOnly: !c.crewOnly }, t("Guardado", "Saved"))} className="font-semibold text-cobalt hover:underline">{c.crewOnly ? t("Abrir a todos", "Open to all") : t("Hacer Crew", "Make Crew")}</button>
                    <button type="button" disabled={busy} onClick={() => call(`/api/admin/team/community/circles/${c.id}`, "PATCH", { archived: !c.archived }, t("Guardado", "Saved"))} className="text-red-600/70 hover:text-red-600">{c.archived ? t("Reabrir", "Reopen") : t("Archivar", "Archive")}</button>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-sp-2 text-xs text-ink/70">
                  <span>{t("Moderadoras:", "Moderators:")} {c.moderators.length ? c.moderators.map((m) => `@${m}`).join(", ") : t("ninguna", "none")}</span>
                  <input value={modFor[c.id] ?? ""} onChange={(e) => setModFor({ ...modFor, [c.id]: e.target.value })} placeholder="@handle" className={`${inputClass} !w-36 !py-1`} />
                  <button type="button" disabled={busy || !(modFor[c.id] ?? "").trim()} onClick={() => call(`/api/admin/team/community/circles/${c.id}`, "PATCH", { moderator: modFor[c.id], on: true }, t("Moderadora nombrada", "Moderator named"))} className={`${secondaryButtonClass} !px-sp-3 !py-1 text-xs`}>{t("Nombrar", "Name")}</button>
                  <button type="button" disabled={busy || !(modFor[c.id] ?? "").trim()} onClick={() => call(`/api/admin/team/community/circles/${c.id}`, "PATCH", { moderator: modFor[c.id], on: false }, t("Moderadora quitada", "Moderator removed"))} className="text-red-600/70 hover:text-red-600">{t("Quitar", "Remove")}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className={eyebrow}>{t("Nueva sesión", "New session")}</p>
        <form onSubmit={createSession} className="grid gap-sp-3 sm:grid-cols-2">
          <label className={label}>{t("Tipo", "Type")}
            <select value={session.kind} onChange={(e) => setSession({ ...session, kind: e.target.value })} className={inputClass}>
              {SESSION_KINDS.map((k) => <option key={k.id} value={k.id}>{lang === "en" ? k.labelEn : k.label}</option>)}
            </select>
          </label>
          <label className={label}>{t("Título", "Title")}<input required maxLength={120} value={session.title} onChange={(e) => setSession({ ...session, title: e.target.value })} className={inputClass} /></label>
          <label className={label}>{t("Quién la da", "Host")}<input required maxLength={80} value={session.hostName} onChange={(e) => setSession({ ...session, hostName: e.target.value })} className={inputClass} /></label>
          <label className={label}>{t("Inicio (tu hora)", "Start (your time)")}<input required type="datetime-local" value={session.startsAt} onChange={(e) => setSession({ ...session, startsAt: e.target.value })} className={inputClass} /></label>
          <label className={label}>{t("Duración (min)", "Duration (min)")}<input type="number" min={15} max={240} value={session.durationMin} onChange={(e) => setSession({ ...session, durationMin: e.target.value })} className={inputClass} /></label>
          <label className={label}>{t("Cupo (vacío = sin límite)", "Capacity (empty = unlimited)")}<input type="number" min={1} max={1000} value={session.capacity} onChange={(e) => setSession({ ...session, capacity: e.target.value })} className={inputClass} /></label>
          <label className={`${label} sm:col-span-2`}>{t("Enlace de la videollamada (https://)", "Call link (https://)")}<input required type="url" value={session.joinUrl} onChange={(e) => setSession({ ...session, joinUrl: e.target.value })} className={inputClass} /><span className="font-normal text-ink/55">{t("Solo lo ve quien reserva su lugar.", "Only people who book a spot see it.")}</span></label>
          <label className={`${label} sm:col-span-2`}>{t("Descripción", "Description")}<textarea rows={2} maxLength={1000} value={session.description} onChange={(e) => setSession({ ...session, description: e.target.value })} className={inputClass} /></label>
          <label className={label}>{t("Círculo (opcional)", "Circle (optional)")}
            <select value={session.circleId} onChange={(e) => setSession({ ...session, circleId: e.target.value })} className={inputClass}>
              <option value="">{t("— ninguno —", "— none —")}</option>
              {circles.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-sp-2 self-end text-sm text-ink"><input type="checkbox" checked={session.crewOnly} onChange={(e) => setSession({ ...session, crewOnly: e.target.checked })} />{t("Solo para el plan Crew", "Crew plan only")}</label>
          <button type="submit" disabled={busy || !session.title.trim() || !session.hostName.trim() || !session.startsAt || !session.joinUrl.trim()} className={`${primaryButtonClass} sm:col-span-2`}>{t("Programar sesión", "Schedule session")}</button>
        </form>
        {sessions.length > 0 && (
          <ul className="mt-sp-4 flex flex-col divide-y divide-line border-t border-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-sp-2 py-sp-3 text-sm">
                <span className={s.canceled ? "text-ink/40 line-through" : "text-ink"}>
                  <span className="font-semibold">{s.title}</span>{s.crewOnly ? " · Crew" : ""}
                  <span className="block text-xs text-ink/55">{new Date(s.startsAt).toLocaleString(lang === "en" ? "en-US" : "es-US")} · {s.hostName} · {t(`${s.rsvps}${s.capacity ? `/${s.capacity}` : ""} reservas`, `${s.rsvps}${s.capacity ? `/${s.capacity}` : ""} bookings`)}</span>
                </span>
                <button type="button" disabled={busy} onClick={() => call(`/api/admin/team/community/sessions/${s.id}`, "PATCH", { canceled: !s.canceled }, t("Guardado", "Saved"))} className="text-xs font-semibold text-coral hover:underline">{s.canceled ? t("Reactivar", "Reactivate") : t("Cancelar sesión", "Cancel session")}</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
