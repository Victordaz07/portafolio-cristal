// Entregables y derechos de uso de un trato (B2). Funciones puras: se prueban en tests/deliverables.test.ts.

export const DELIVERABLE_STATUSES = ["todo", "draft", "in_review", "approved", "published"] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const DELIVERABLE_STATUS_META: Record<DeliverableStatus, { label: string; labelEn: string; className: string }> = {
  todo: { label: "Por hacer", labelEn: "To do", className: "bg-cream text-ink/70" },
  draft: { label: "Borrador", labelEn: "Draft", className: "bg-sage/30 text-ink" },
  in_review: { label: "En revisión", labelEn: "In review", className: "bg-cobalt/15 text-cobalt-ink" },
  approved: { label: "Aprobado", labelEn: "Approved", className: "bg-lime/40 text-moss" },
  published: { label: "Publicado", labelEn: "Published", className: "bg-ink text-cream" },
};

export const DELIVERABLE_NETWORKS = ["instagram", "tiktok", "youtube", "facebook", "ugc", "otro"] as const;
export const NETWORK_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  ugc: "UGC",
  otro: "—",
};

/** Opciones de días para derechos de uso y exclusividad en el formulario del trato. */
export const RIGHTS_DAY_OPTIONS = [30, 60, 90, 180, 365] as const;

export function isDeliverableStatus(value: unknown): value is DeliverableStatus {
  return typeof value === "string" && (DELIVERABLE_STATUSES as readonly string[]).includes(value);
}

/** Ya no hay nada que hacer (la marca lo aprobó o ya se publicó). */
export function isDeliverableDone(status: string) {
  return status === "approved" || status === "published";
}

const DAY = 86_400_000;

/** Días enteros (por fecha de calendario en UTC) desde `now` hasta `date`. Negativo = ya pasó. */
export function daysFromNow(date: Date, now: Date = new Date()) {
  const a = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((a - b) / DAY);
}

/** Fecha en que vencen los derechos de uso (inicio + días), o null si no aplica. */
export function usageRightsEnd(start: Date | string | null | undefined, days: number | null | undefined) {
  if (!start || !days || days <= 0) return null;
  const s = typeof start === "string" ? new Date(start) : start;
  return new Date(s.getTime() + days * DAY);
}

/** Avisar 2 días antes (o el mismo día, o si se pasó y nunca se avisó) de un entregable abierto. */
export const DELIVERABLE_REMIND_DAYS = 2;
export function shouldRemindDeliverable(d: { status: string; dueAt: Date | null; remindedAt: Date | null }, now: Date = new Date()) {
  if (!d.dueAt || d.remindedAt || isDeliverableDone(d.status)) return false;
  const days = daysFromNow(d.dueAt, now);
  return days <= DELIVERABLE_REMIND_DAYS && days >= -1;
}

/** Avisar 7 días antes de que venzan los derechos de uso (una vez por periodo de derechos). */
export const RIGHTS_REMIND_DAYS = 7;
export function shouldRemindRights(
  b: { usageRightsStart: Date | null; usageRightsDays: number | null; usageReminderAt: Date | null },
  now: Date = new Date()
) {
  const end = usageRightsEnd(b.usageRightsStart, b.usageRightsDays);
  if (!end) return false;
  // Si los derechos se renovaron (nuevo inicio) después del último aviso, se puede volver a avisar.
  if (b.usageReminderAt && b.usageRightsStart && b.usageReminderAt >= b.usageRightsStart) return false;
  const days = daysFromNow(end, now);
  return days <= RIGHTS_REMIND_DAYS && days >= 0;
}
