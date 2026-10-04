import { test } from "node:test";
import assert from "node:assert/strict";
import { engagementRate, formatCompact, hasMetrics, MIN_VIEWS_FOR_ENGAGEMENT } from "../lib/metrics";

const m = (views: number | null, likes = 0, comments = 0) => ({ views, likes, comments, shares: null, saves: null });

test("engagement = interacciones / vistas, con un decimal", () => {
  assert.equal(engagementRate(m(1000, 50, 10)), 6);
  assert.equal(engagementRate(m(300, 10)), 3.3);
});

test("sin suficientes vistas o sin interacciones no hay engagement", () => {
  assert.equal(engagementRate(m(MIN_VIEWS_FOR_ENGAGEMENT - 1, 2)), null);
  assert.equal(engagementRate(m(null, 5)), null);
  assert.equal(engagementRate(m(500)), null);
});

test("formatCompact", () => {
  assert.equal(formatCompact(null), "—");
  assert.equal(formatCompact(890), "890");
  assert.equal(formatCompact(1234), "1.2K");
  assert.equal(formatCompact(540000), "540K");
  assert.equal(formatCompact(1234567), "1.2M");
});

test("hasMetrics", () => {
  assert.equal(hasMetrics({ views: null, likes: null, comments: null, shares: null, saves: null }), false);
  assert.equal(hasMetrics({ views: 0, likes: null, comments: null, shares: null, saves: null }), true);
});
