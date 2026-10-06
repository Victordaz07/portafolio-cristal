import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarDays, depositSplit, displayStatus, invoiceNumber, itemsTotal, parseItems, reminderDue } from "../lib/invoices";

const now = new Date("2026-10-06T15:00:00Z");
const day = (n: number) => new Date(now.getTime() + n * 86_400_000);

test("total de la factura en centavos", () => {
  assert.equal(itemsTotal([{ description: "Reel", quantity: 2, unitAmount: 25_000 }, { description: "Historias", quantity: 3, unitAmount: 5_000 }]), 65_000);
  assert.equal(itemsTotal([{ description: "x", quantity: -1, unitAmount: 100 }, { description: "y", quantity: 1, unitAmount: -5 }]), 0);
  assert.equal(itemsTotal([]), 0);
});

test("número consecutivo de factura", () => {
  assert.equal(invoiceNumber("FC", 2026, 7), "FC-2026-0007");
  assert.equal(invoiceNumber("crisl ia!", 2026, 12), "CRISLI-2026-0012");
  assert.equal(invoiceNumber("", 2026, 1), "FC-2026-0001");
});

test("anticipo y saldo", () => {
  assert.deepEqual(depositSplit(100_000, 50), { deposit: 50_000, balance: 50_000 });
  assert.deepEqual(depositSplit(99_999, 30), { deposit: 30_000, balance: 69_999 });
  assert.deepEqual(depositSplit(1000, 150), { deposit: 1000, balance: 0 });
});

test("estado que se muestra", () => {
  const sent = { status: "sent", dueAt: day(3), viewedAt: null };
  assert.equal(displayStatus(sent, now), "sent");
  assert.equal(displayStatus({ ...sent, viewedAt: now }, now), "viewed");
  assert.equal(displayStatus({ ...sent, dueAt: day(0) }, now), "sent", "el día que vence todavía no está vencida");
  assert.equal(displayStatus({ ...sent, dueAt: day(-1), viewedAt: now }, now), "overdue");
  assert.equal(displayStatus({ ...sent, status: "paid", dueAt: day(-10) }, now), "paid");
  assert.equal(displayStatus({ ...sent, status: "draft" }, now), "draft");
});

test("recordatorios a la marca: día 0, 7 y 14, uno por día, máximo 3", () => {
  const inv = { status: "sent", dueAt: day(0), remindersSent: 0, lastReminderAt: null };
  assert.equal(reminderDue(inv, now), true);
  assert.equal(reminderDue({ ...inv, dueAt: day(1) }, now), false, "antes de vencer no");
  assert.equal(reminderDue({ ...inv, remindersSent: 1, lastReminderAt: day(-1) }, now), false, "el segundo es a los 7 días");
  assert.equal(reminderDue({ ...inv, dueAt: day(-7), remindersSent: 1, lastReminderAt: day(-7) }, now), true);
  assert.equal(reminderDue({ ...inv, dueAt: day(-20), remindersSent: 1, lastReminderAt: now }, now), false, "máximo uno por día");
  assert.equal(reminderDue({ ...inv, dueAt: day(-30), remindersSent: 3, lastReminderAt: day(-10) }, now), false, "máximo 3");
  assert.equal(reminderDue({ ...inv, status: "paid" }, now), false);
  assert.equal(calendarDays(day(-2), now), 2);
});

test("leer ítems guardados", () => {
  assert.deepEqual(parseItems([{ description: "Reel", quantity: "2", unitAmount: 100 }, { nope: 1 }, null]), [{ description: "Reel", quantity: 2, unitAmount: 100 }]);
  assert.deepEqual(parseItems("x"), []);
});
