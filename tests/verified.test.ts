import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { caseStudyHighlights, daysSince, editsMetrics, engagementSummary, followerSeal, totalFollowerSeal } from "../lib/verified";

const now = new Date("2026-10-10T12:00:00Z");
const card = (over: Record<string, unknown> = {}) => ({ views: 1000, likes: 80, comments: 10, shares: 5, saves: 5, metricsSyncedAt: new Date("2026-10-08T12:00:00Z"), ...over }) as Parameters<typeof engagementSummary>[0][number];

describe("sello de seguidores", () => {
  it("lleva sello si el dato vino de la cuenta conectada y es reciente", () => {
    const s = followerSeal({ platform: "instagram", date: "2026-10-08", source: "auto" }, now);
    assert.equal(s?.days, 2);
  });
  it("un dato escrito a mano no lleva sello", () => {
    assert.equal(followerSeal({ platform: "instagram", date: "2026-10-09", source: "manual" }, now), null);
  });
  it("un dato viejo (más de 30 días) pierde el sello", () => {
    assert.equal(followerSeal({ platform: "instagram", date: "2026-08-01", source: "auto" }, now), null);
  });
  it("el total solo lleva sello si todas las redes son automáticas, con la fecha más antigua", () => {
    const ok = totalFollowerSeal([{ platform: "a", date: "2026-10-09", source: "auto" }, { platform: "b", date: "2026-10-05", source: "auto" }], now);
    assert.equal(ok?.days, 5);
    assert.equal(totalFollowerSeal([{ platform: "a", date: "2026-10-09", source: "auto" }, { platform: "b", date: "2026-10-09", source: "manual" }], now), null);
    assert.equal(totalFollowerSeal([], now), null);
  });
});

describe("engagement verificado", () => {
  it("lleva sello si todas las publicaciones fueron sincronizadas", () => {
    const r = engagementSummary([card(), card()], now);
    assert.equal(r.value, 10);
    assert.equal(r.seal?.days, 2);
  });
  it("una publicación escrita a mano quita el sello pero no el número", () => {
    const r = engagementSummary([card(), card({ metricsSyncedAt: null })], now);
    assert.equal(r.value, 10);
    assert.equal(r.seal, null);
  });
  it("las publicaciones sin engagement calculable no cuentan", () => {
    const r = engagementSummary([card(), card({ views: 3, metricsSyncedAt: null })], now);
    assert.ok(r.seal);
  });
  it("sin datos no hay valor ni sello", () => {
    assert.deepEqual(engagementSummary([], now), { value: null, seal: null });
  });
});

describe("ediciones y casos de éxito", () => {
  it("editsMetrics detecta cambios de números pero no de otros campos", () => {
    assert.equal(editsMetrics({ views: 10 }), true);
    assert.equal(editsMetrics({ likes: null }), true);
    assert.equal(editsMetrics({}), false);
  });
  it("daysSince no da negativos", () => {
    assert.equal(daysSince("2026-10-20", now), 0);
  });
  it("el caso de éxito muestra solo lo que el reporte deja ver", () => {
    const h = caseStudyHighlights({ brand: "X", title: "T", totals: { views: 5000, engagement: 7.5, posts: 2 }, comparison: { viewsRatio: 1.4 } });
    assert.deepEqual(h.map((x) => x.key), ["views", "engagement", "ratio"]);
    const none = caseStudyHighlights({ brand: "X", title: "T", totals: { posts: 2 }, comparison: { viewsRatio: 0.8 } });
    assert.deepEqual(none, [{ key: "posts", value: 2 }]);
  });
});
