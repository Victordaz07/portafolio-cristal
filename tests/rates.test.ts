import { test } from "node:test";
import assert from "node:assert/strict";
import { bundleFactor, calculateRate, engagementFactor, exclusivityFactor, roundPrice, usageFactor, type RateInput } from "../lib/rates";

const base: RateInput = {
  platform: "instagram",
  format: "reel",
  quantity: 1,
  followers: 10_000,
  usageDays: 0,
  exclusivityDays: 0,
  whitelisting: false,
};

test("precio base por cada 1,000 seguidores", () => {
  const r = calculateRate(base);
  assert.equal(r.fair, 120); // 10 × $12
  assert.equal(r.low, 95);
  assert.equal(r.high, 155);
  assert.equal(r.audienceSource, "followers");
});

test("cuentas pequeñas tienen un piso por pieza", () => {
  const r = calculateRate({ ...base, format: "story", followers: 1_000 });
  assert.equal(r.fair, 50);
});

test("TikTok y YouTube usan las vistas medianas si existen", () => {
  const r = calculateRate({ ...base, platform: "tiktok", format: "video", followers: 10_000, medianViews: 50_000 });
  assert.equal(r.audienceSource, "views");
  assert.equal(r.fair, 1100); // 50 × $22
  const noViews = calculateRate({ ...base, platform: "tiktok", format: "video", followers: 10_000 });
  assert.equal(noViews.audienceSource, "followers");
  assert.equal(noViews.fair, 220);
});

test("más interacción que el nicho sube el precio (con topes)", () => {
  assert.equal(engagementFactor(6, 3), 1.5);
  assert.equal(engagementFactor(3, 3), 1);
  assert.equal(engagementFactor(30, 3), 2.5);
  assert.equal(engagementFactor(0.5, 3), 0.75);
  assert.equal(engagementFactor(null, 3), 1);
  const r = calculateRate({ ...base, creatorEr: 6, nicheEr: 3 });
  assert.equal(r.fair, 180);
  assert.ok(r.steps.some((s) => s.id === "engagement" && s.factor === 1.5));
});

test("derechos de uso, exclusividad, whitelisting y paquetes", () => {
  assert.equal(usageFactor(0), 1);
  assert.equal(usageFactor(30), 1.25);
  assert.equal(usageFactor(90), 1.75);
  assert.equal(usageFactor(365), 2.5);
  assert.equal(exclusivityFactor(30), 1.1);
  assert.equal(exclusivityFactor(365), 1.3);
  assert.equal(bundleFactor(1), 1);
  assert.equal(bundleFactor(3), 0.95);
  assert.equal(bundleFactor(5), 0.9);
  const r = calculateRate({ ...base, usageDays: 30, whitelisting: true });
  assert.equal(r.fair, 195); // 120 × 1.25 × 1.3
});

test("UGC tiene precio por pieza y no depende de seguidores", () => {
  const r = calculateRate({ ...base, platform: "ugc", format: "video", followers: null, quantity: 2, usageDays: 90 });
  assert.equal(r.fair, 615); // 175 × 2 × 1.75 = 612.5
  assert.equal(r.audienceSource, "none");
  assert.equal(r.perPiece, 310);
});

test("redondeo de precios", () => {
  assert.equal(roundPrice(97), 95);
  assert.equal(roundPrice(1234), 1230);
  assert.equal(roundPrice(1), 5);
});
