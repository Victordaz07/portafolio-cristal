import { prisma } from "@/lib/prisma";
import { currentCreatorId } from "@/lib/tenant";
import { appTimeZone } from "@/lib/growth-server";
import { addDays } from "@/lib/growth";
import { utcToZoned, zonedToUtc } from "@/lib/content-plan";
import { dateInputToDate, dateToInput } from "@/lib/crm";
import { DEFAULT_LOAD_LIMIT, groupByBrand, planRest, type BrandNotice, type RestPlan } from "@/lib/wellbeing";

export interface MovedEntry {
  type: "post" | "deliverable";
  id: string;
  from: string;
  to: string;
}

export async function getLoadLimit() {
  const settings = await prisma.wellbeingSettings.findFirst({ select: { loadLimit: true } });
  return settings?.loadLimit ?? DEFAULT_LOAD_LIMIT;
}

export async function saveLoadLimit(limit: number) {
  const creatorId = await currentCreatorId();
  await prisma.wellbeingSettings.upsert({ where: { creatorId }, create: { loadLimit: limit }, update: { loadLimit: limit } });
}

/** Entregas pendientes con fecha (para medir la carga de trabajo). */
export async function pendingDeliverableDates() {
  const rows = await prisma.deliverable.findMany({ where: { dueAt: { not: null }, status: { notIn: ["approved", "published"] } }, select: { dueAt: true } });
  return rows.map((r) => ({ date: dateToInput(r.dueAt) }));
}

/** Qué se movería con un descanso (sin tocar nada) y a qué marcas se les podría avisar. */
export async function previewRest(start: string, end: string, moveDeliverables: boolean): Promise<{ plan: RestPlan; notices: BrandNotice[] }> {
  const tz = appTimeZone();
  const [posts, deliverables] = await Promise.all([
    prisma.scheduledPost.findMany({ where: { status: "scheduled", scheduledFor: { gte: zonedToUtc(addDays(start, -1), "00:00", tz), lt: zonedToUtc(addDays(end, 2), "00:00", tz) } }, select: { id: true, scheduledFor: true, status: true } }),
    prisma.deliverable.findMany({ where: { dueAt: { not: null }, status: { notIn: ["approved", "published"] } }, select: { id: true, dueAt: true, title: true, brandId: true, status: true } }),
  ]);
  const plan = planRest({
    posts: posts.map((p) => ({ id: p.id, ...utcToZoned(p.scheduledFor, tz), status: p.status })).map((p) => ({ id: p.id, dateKey: p.dateKey, time: p.time, status: p.status })),
    deliverables: deliverables.map((d) => ({ id: d.id, dueKey: dateToInput(d.dueAt), title: d.title, brandId: d.brandId, status: d.status })),
    start,
    end,
    moveDeliverables,
  });
  const brandIds = Array.from(new Set(plan.affectedDeliverables.map((d) => d.brandId)));
  const brands = await prisma.brand.findMany({ where: { id: { in: brandIds } }, select: { id: true, name: true, contactEmail: true } });
  const notices = groupByBrand(plan.affectedDeliverables, new Map(brands.map((b) => [b.id, { name: b.name, email: b.contactEmail }])));
  return { plan, notices };
}

/** Activa el descanso: mueve lo que toca y guarda cómo estaba para poder deshacerlo. */
export async function applyRest(start: string, end: string, note: string, moveDeliverables: boolean) {
  const tz = appTimeZone();
  const { plan, notices } = await previewRest(start, end, moveDeliverables);
  const moved: MovedEntry[] = [];
  for (const p of plan.posts) {
    const current = await prisma.scheduledPost.findUnique({ where: { id: p.id }, select: { scheduledFor: true } });
    if (!current) continue;
    const next = zonedToUtc(p.to, p.time, tz);
    // El condicional evita pisar un cambio hecho al mismo tiempo en otra pestaña.
    const result = await prisma.scheduledPost.updateMany({ where: { id: p.id, scheduledFor: current.scheduledFor }, data: { scheduledFor: next, publishAttempts: 0 } });
    if (result.count) moved.push({ type: "post", id: p.id, from: current.scheduledFor.toISOString(), to: next.toISOString() });
  }
  for (const d of plan.deliverables) {
    const current = await prisma.deliverable.findUnique({ where: { id: d.id }, select: { dueAt: true } });
    if (!current?.dueAt) continue;
    const next = dateInputToDate(d.to);
    // remindedAt se borra: la fecha cambió, así que el recordatorio de «vence en 2 días» vuelve a aplicar.
    const result = await prisma.deliverable.updateMany({ where: { id: d.id, dueAt: current.dueAt }, data: { dueAt: next, remindedAt: null } });
    if (result.count) moved.push({ type: "deliverable", id: d.id, from: current.dueAt.toISOString(), to: next.toISOString() });
  }
  const period = await prisma.restPeriod.create({
    data: { startDate: start, endDate: end, note, moved: moved as object[], brands: notices.map((n) => ({ ...n, sentAt: null })) as object[] },
  });
  return { id: period.id, movedPosts: moved.filter((m) => m.type === "post").length, movedDeliverables: moved.filter((m) => m.type === "deliverable").length, notices };
}

/** Deshace un descanso: devuelve cada cosa a su fecha, salvo lo que la persona ya volvió a cambiar. */
export async function undoRest(id: string) {
  const period = await prisma.restPeriod.findUnique({ where: { id } });
  if (!period || period.undoneAt) return null;
  const moved = (Array.isArray(period.moved) ? period.moved : []) as unknown as MovedEntry[];
  let restored = 0;
  let skipped = 0;
  for (const m of moved) {
    const result =
      m.type === "post"
        ? await prisma.scheduledPost.updateMany({ where: { id: m.id, scheduledFor: new Date(m.to) }, data: { scheduledFor: new Date(m.from) } })
        : await prisma.deliverable.updateMany({ where: { id: m.id, dueAt: new Date(m.to) }, data: { dueAt: new Date(m.from), remindedAt: null } });
    if (result.count) restored += 1;
    else skipped += 1;
  }
  await prisma.restPeriod.update({ where: { id }, data: { undoneAt: new Date() } });
  return { restored, skipped };
}
