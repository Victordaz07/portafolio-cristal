import { test } from "node:test";
import assert from "node:assert/strict";
import { billingState, extendPaidUntil, getPlan, priceCents } from "../lib/billing";

const now = new Date("2026-05-10T00:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

test("estado de la cuenta", () => {
  assert.equal(billingState({ plan: "pro", comp: true, paidUntil: null, trialEndsAt: null }, now).state, "comp");
  assert.equal(billingState({ plan: "pro", comp: false, paidUntil: days(5), trialEndsAt: null }, now).state, "active");
  assert.equal(billingState({ plan: "pro", comp: false, paidUntil: null, trialEndsAt: days(3) }, now).state, "trial");
  assert.equal(billingState({ plan: "pro", comp: false, paidUntil: days(-1), trialEndsAt: null }, now).state, "expired");
  assert.equal(billingState({ plan: "pro", comp: false, paidUntil: null, trialEndsAt: null }, now).state, "none");
});

test("el plan anual regala 2 meses", () => {
  const monthly = getPlan("pro").price * 100;
  assert.equal(priceCents("pro", 1), monthly);
  assert.equal(priceCents("pro", 3), monthly * 3);
  assert.equal(priceCents("pro", 12), monthly * 10);
});

test("pagar extiende desde el vencimiento si aún está vigente", () => {
  assert.equal(extendPaidUntil(null, 1, now).toISOString(), "2026-06-10T00:00:00.000Z");
  assert.equal(extendPaidUntil(new Date("2026-05-20T00:00:00Z"), 1, now).toISOString(), "2026-06-20T00:00:00.000Z");
  assert.equal(extendPaidUntil(new Date("2026-04-01T00:00:00Z"), 1, now).toISOString(), "2026-06-10T00:00:00.000Z");
});
