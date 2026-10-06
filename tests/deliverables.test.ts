import { test } from "node:test";
import assert from "node:assert/strict";
import { daysFromNow, isDeliverableDone, shouldRemindDeliverable, shouldRemindRights, usageRightsEnd } from "../lib/deliverables";

const now = new Date("2026-10-06T15:00:00Z");
const day = (n: number) => new Date(now.getTime() + n * 86_400_000);

test("días hasta una fecha (por día de calendario)", () => {
  assert.equal(daysFromNow(day(0), now), 0);
  assert.equal(daysFromNow(day(2), now), 2);
  assert.equal(daysFromNow(day(-3), now), -3);
});

test("fin de los derechos de uso", () => {
  assert.equal(usageRightsEnd(null, 30), null);
  assert.equal(usageRightsEnd(now, null), null);
  assert.equal(usageRightsEnd(now, 30)?.toISOString(), day(30).toISOString());
});

test("aviso de entregables: 2 días antes, una sola vez y solo si sigue abierto", () => {
  const base = { status: "todo", dueAt: day(2), remindedAt: null };
  assert.equal(shouldRemindDeliverable(base, now), true);
  assert.equal(shouldRemindDeliverable({ ...base, dueAt: day(3) }, now), false);
  assert.equal(shouldRemindDeliverable({ ...base, dueAt: day(0) }, now), true);
  assert.equal(shouldRemindDeliverable({ ...base, remindedAt: now }, now), false);
  assert.equal(shouldRemindDeliverable({ ...base, status: "published" }, now), false);
  assert.equal(shouldRemindDeliverable({ ...base, dueAt: null }, now), false);
  assert.equal(isDeliverableDone("approved"), true);
  assert.equal(isDeliverableDone("in_review"), false);
});

test("aviso de derechos de uso: 7 días antes y otra vez solo si se renuevan", () => {
  const b = { usageRightsStart: day(-25), usageRightsDays: 30, usageReminderAt: null };
  assert.equal(shouldRemindRights(b, now), true); // vence en 5 días
  assert.equal(shouldRemindRights({ ...b, usageRightsStart: day(-10) }, now), false); // vence en 20
  assert.equal(shouldRemindRights({ ...b, usageRightsStart: day(-31) }, now), false); // ya venció
  assert.equal(shouldRemindRights({ ...b, usageReminderAt: day(-1) }, now), false); // ya se avisó
  // Renovado: nuevo inicio después del último aviso
  assert.equal(shouldRemindRights({ usageRightsStart: day(-25), usageRightsDays: 30, usageReminderAt: day(-40) }, now), true);
});
