// Propuestas a marcas (C1): lógica pura de los seguimientos. Se prueba en tests/pitch.test.ts.
// Foliocrew NO manda correos a marcas por la creadora: ella los envía desde su propio correo (cuida su reputación y evita spam).

/** Días después de enviar la propuesta en que toca el seguimiento 1 y el 2. */
export const FOLLOW_UP_DAYS = [5, 12] as const;

export interface PitchFields {
  dealStatus: string | null;
  pitchSentAt: Date | string | null;
  pitchFollowUps: number;
  pitchRepliedAt: Date | string | null;
}

export type PitchPhase =
  /** No hay propuesta en curso. */
  | "none"
  /** Enviada, todavía no toca seguimiento. */
  | "waiting"
  /** Ya toca escribir el seguimiento 1 o 2. */
  | "followup-due"
  /** Se enviaron los dos seguimientos y la marca no respondió. */
  | "exhausted"
  /** La marca respondió. */
  | "replied";

export interface PitchState {
  phase: PitchPhase;
  /** Días desde que se envió (0 si no hay propuesta). */
  daysSince: number;
  /** Qué seguimiento toca (1 o 2); null si no toca ninguno. */
  followUpNumber: 1 | 2 | null;
  /** Cuándo toca el próximo seguimiento (null si ya no hay más). */
  nextFollowUpAt: Date | null;
}

const DAY = 86_400_000;
const asDate = (d: Date | string | null) => (d ? new Date(d) : null);

export function pitchState(brand: PitchFields, now = new Date()): PitchState {
  const sent = asDate(brand.pitchSentAt);
  if (!sent) return { phase: "none", daysSince: 0, followUpNumber: null, nextFollowUpAt: null };
  const daysSince = Math.max(0, Math.floor((now.getTime() - sent.getTime()) / DAY));
  if (brand.pitchRepliedAt) return { phase: "replied", daysSince, followUpNumber: null, nextFollowUpAt: null };
  const done = Math.min(Math.max(brand.pitchFollowUps, 0), FOLLOW_UP_DAYS.length);
  if (done >= FOLLOW_UP_DAYS.length) return { phase: "exhausted", daysSince, followUpNumber: null, nextFollowUpAt: null };
  const nextFollowUpAt = new Date(sent.getTime() + FOLLOW_UP_DAYS[done] * DAY);
  const due = now.getTime() >= nextFollowUpAt.getTime();
  return { phase: due ? "followup-due" : "waiting", daysSince, followUpNumber: due ? ((done + 1) as 1 | 2) : null, nextFollowUpAt };
}

/** Una propuesta «sin respuesta»: enviada, la marca no respondió y el trato sigue como prospecto. */
export const isUnanswered = (brand: PitchFields, now = new Date()) => {
  if (brand.dealStatus !== "prospect") return false;
  const { phase } = pitchState(brand, now);
  return phase === "waiting" || phase === "followup-due" || phase === "exhausted";
};

/** Enlace «Abrir en mi correo» (el cuerpo se recorta para no pasarse del límite de los enlaces mailto). */
export function mailtoLink(to: string | null | undefined, subject: string, body: string) {
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1500))}`;
  return `mailto:${encodeURIComponent((to ?? "").trim())}?${query}`;
}

/** Fecha (sin hora) para la «próxima acción» del CRM: hoy + N días a mediodía UTC, como el resto de fechas del CRM. */
export function followUpDate(from: Date, days: number) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + days, 12));
  return d;
}
