// Círculos, mentorías y sesiones en vivo (E7). Lógica pura (se prueba en tests/circles.test.ts).

export const CIRCLE_KINDS = [
  { id: "niche", label: "Nicho", labelEn: "Niche" },
  { id: "network", label: "Red social", labelEn: "Network" },
  { id: "level", label: "Nivel", labelEn: "Level" },
  { id: "general", label: "General", labelEn: "General" },
] as const;
export type CircleKind = (typeof CIRCLE_KINDS)[number]["id"];
export const isCircleKind = (v: string): v is CircleKind => CIRCLE_KINDS.some((k) => k.id === v);

export const SESSION_KINDS = [
  { id: "live", label: "Sesión en vivo", labelEn: "Live session" },
  { id: "mentoring", label: "Mentoría grupal", labelEn: "Group mentoring" },
] as const;
export type SessionKind = (typeof SESSION_KINDS)[number]["id"];
export const isSessionKind = (v: string): v is SessionKind => SESSION_KINDS.some((k) => k.id === v);

export const MAX_MESSAGE = 1000;
export const MAX_CIRCLE_MEMBERS_SHOWN = 12;
export const MAX_CIRCLES_PER_PERSON = 20;
export const MESSAGES_PER_10_MIN = 6;
export const PAGE_SIZE = 40;

/** Crew: el beneficio del plan más alto. Una cuenta «de cortesía» (comp) también cuenta. */
export function hasCrewAccess(account: { plan: string; comp: boolean }) {
  return account.comp || account.plan === "crew";
}

/** ¿Puede entrar? Lo que es solo para Crew exige el plan Crew. */
export const canAccess = (crewOnly: boolean, account: { plan: string; comp: boolean }) => !crewOnly || hasCrewAccess(account);

/** «Cocina saludable & fit» → «cocina-saludable-fit». */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export type CircleCheck = { ok: true; slug: string } | { ok: false; reason: "name" | "kind" | "description" };
export function validateCircle(input: { name: string; kind: string; description?: string }): CircleCheck {
  const slug = slugify(input.name);
  if (!input.name.trim() || input.name.trim().length > 60 || slug.length < 2) return { ok: false, reason: "name" };
  if (!isCircleKind(input.kind)) return { ok: false, reason: "kind" };
  if ((input.description ?? "").length > 500) return { ok: false, reason: "description" };
  return { ok: true, slug };
}

export const isHttpsUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname.includes(".");
  } catch {
    return false;
  }
};

export type SessionCheck = { ok: true } | { ok: false; reason: "kind" | "title" | "host" | "date" | "duration" | "url" | "capacity" | "description" };
export function validateSession(input: { kind: string; title: string; hostName: string; startsAt: Date; durationMin: number; joinUrl: string; capacity?: number | null; description?: string }, now: Date = new Date()): SessionCheck {
  if (!isSessionKind(input.kind)) return { ok: false, reason: "kind" };
  if (!input.title.trim() || input.title.trim().length > 120) return { ok: false, reason: "title" };
  if (!input.hostName.trim() || input.hostName.trim().length > 80) return { ok: false, reason: "host" };
  if (Number.isNaN(input.startsAt.getTime()) || input.startsAt.getTime() < now.getTime() - 3_600_000) return { ok: false, reason: "date" };
  if (!Number.isInteger(input.durationMin) || input.durationMin < 15 || input.durationMin > 240) return { ok: false, reason: "duration" };
  if (!isHttpsUrl(input.joinUrl)) return { ok: false, reason: "url" };
  if (input.capacity != null && (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 1000)) return { ok: false, reason: "capacity" };
  if ((input.description ?? "").length > 1000) return { ok: false, reason: "description" };
  return { ok: true };
}

export type SessionPhase = "upcoming" | "live" | "ended" | "canceled";

/** «En vivo» desde 15 minutos antes del inicio hasta que termina. */
export function sessionPhase(s: { startsAt: Date; durationMin: number; canceledAt: Date | null }, now: Date = new Date()): SessionPhase {
  if (s.canceledAt) return "canceled";
  const start = s.startsAt.getTime();
  const end = start + s.durationMin * 60_000;
  if (now.getTime() >= end) return "ended";
  if (now.getTime() >= start - 15 * 60_000) return "live";
  return "upcoming";
}

export type RsvpDecision = "ok" | "already" | "full" | "ended" | "canceled" | "crew";

/** ¿Se puede reservar lugar? Si ya reservó, no se repite; si el cupo está lleno, no entra. */
export function rsvpDecision(opts: { phase: SessionPhase; crewOnly: boolean; account: { plan: string; comp: boolean }; taken: number; capacity: number | null; already: boolean }): RsvpDecision {
  if (opts.phase === "canceled") return "canceled";
  if (opts.phase === "ended") return "ended";
  if (!canAccess(opts.crewOnly, opts.account)) return "crew";
  if (opts.already) return "already";
  if (opts.capacity != null && opts.taken >= opts.capacity) return "full";
  return "ok";
}

const ics = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Archivo .ics para añadir la sesión al calendario (el enlace va solo para quien reservó). */
export function icsFor(s: { id: string; title: string; description: string; startsAt: Date; durationMin: number; joinUrl: string }) {
  const end = new Date(s.startsAt.getTime() + s.durationMin * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Foliocrew//Sesiones//ES",
    "BEGIN:VEVENT",
    `UID:${s.id}@foliocrew.pro`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(s.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${ics(s.title)}`,
    `DESCRIPTION:${ics(`${s.description}\n\n${s.joinUrl}`.trim())}`,
    `URL:${s.joinUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
