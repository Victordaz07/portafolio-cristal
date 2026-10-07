import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupByBrand, planRest, restLength, restNoticeDraft, validateRest, workload } from "../lib/wellbeing";

describe("descanso", () => {
  it("cuenta los días incluyendo el primero y el último", () => {
    assert.equal(restLength("2026-10-10", "2026-10-10"), 1);
    assert.equal(restLength("2026-10-10", "2026-10-16"), 7);
  });
  it("valida fechas", () => {
    assert.deepEqual(validateRest("2026-10-10", "2026-10-16", "2026-10-07"), { ok: true, days: 7 });
    assert.deepEqual(validateRest("2026-10-16", "2026-10-10", "2026-10-07"), { ok: false, reason: "order" });
    assert.deepEqual(validateRest("2026-10-01", "2026-10-03", "2026-10-07"), { ok: false, reason: "past" });
    assert.deepEqual(validateRest("2026-10-10", "2026-12-30", "2026-10-07"), { ok: false, reason: "long" });
    assert.deepEqual(validateRest("2026-02-30", "2026-03-02", "2026-01-01"), { ok: false, reason: "dates" });
  });
  const posts = [
    { id: "p1", dateKey: "2026-10-10", time: "18:00", status: "scheduled" },
    { id: "p2", dateKey: "2026-10-12", time: "09:30", status: "scheduled" },
    { id: "p3", dateKey: "2026-10-12", time: "09:30", status: "published" },
    { id: "p4", dateKey: "2026-10-20", time: "10:00", status: "scheduled" },
    { id: "p5", dateKey: "2026-10-11", time: "10:00", status: "draft" },
  ];
  const deliverables = [
    { id: "d1", dueKey: "2026-10-11", title: "Reel", brandId: "b1", status: "todo" },
    { id: "d2", dueKey: "2026-10-11", title: "Foto", brandId: "b1", status: "approved" },
    { id: "d3", dueKey: "2026-10-15", title: "Story", brandId: "b2", status: "draft" },
    { id: "d4", dueKey: "2026-11-01", title: "Lejos", brandId: "b2", status: "todo" },
  ];
  it("mueve solo lo programado dentro del descanso, tantos días como dura", () => {
    const plan = planRest({ posts, deliverables, start: "2026-10-10", end: "2026-10-16", moveDeliverables: true });
    assert.deepEqual(plan.posts.map((p) => [p.id, p.to]), [["p1", "2026-10-17"], ["p2", "2026-10-19"]]);
    assert.deepEqual(plan.deliverables.map((d) => [d.id, d.to]), [["d1", "2026-10-18"], ["d3", "2026-10-22"]]);
    assert.equal(plan.days, 7);
  });
  it("sin mover entregas, igual detecta cuáles se afectan", () => {
    const plan = planRest({ posts, deliverables, start: "2026-10-10", end: "2026-10-16", moveDeliverables: false });
    assert.equal(plan.deliverables.length, 0);
    assert.deepEqual(plan.affectedDeliverables.map((d) => d.id), ["d1", "d3"]);
  });
  it("agrupa por marca y redacta un aviso", () => {
    const groups = groupByBrand(planRest({ posts, deliverables, start: "2026-10-10", end: "2026-10-16", moveDeliverables: false }).affectedDeliverables, new Map([["b1", { name: "Sol", email: "a@sol.com" }], ["b2", { name: "Luna", email: null }]]));
    assert.deepEqual(groups.map((g) => [g.brandName, g.titles, g.email]), [["Luna", ["Story"], null], ["Sol", ["Reel"], "a@sol.com"]]);
    const es = restNoticeDraft({ creatorName: "Ana", brandName: "Sol", titles: ["Reel"], start: "2026-10-10", end: "2026-10-16", newDate: "2026-10-17", lang: "es" });
    assert.match(es, /Hola equipo de Sol/);
    assert.match(es, /• Reel/);
    assert.match(restNoticeDraft({ creatorName: "Ana", brandName: "Sol", titles: ["Reel"], start: "a", end: "b", newDate: "c", lang: "en" }), /Hi Sol team/);
  });
});

describe("carga de trabajo", () => {
  const d = (...dates: string[]) => dates.map((date) => ({ date }));
  it("encuentra la ventana de 7 días más cargada", () => {
    const r = workload(d("2026-10-08", "2026-10-09", "2026-10-09", "2026-10-12", "2026-10-14", "2026-10-30"), "2026-10-07", 4, 4);
    assert.equal(r.peak, 5);
    assert.equal(r.peakStart, "2026-10-08");
    assert.equal(r.over, true);
  });
  it("no avisa si está dentro del límite", () => {
    const r = workload(d("2026-10-08", "2026-10-20"), "2026-10-07", 4, 6);
    assert.equal(r.over, false);
    assert.equal(r.peak, 1);
  });
  it("cuenta por semana y ignora lo fuera del horizonte", () => {
    const r = workload(d("2026-10-07", "2026-10-13", "2026-10-14", "2027-01-01", "2026-10-01"), "2026-10-07", 2, 6);
    assert.deepEqual(r.weeks, [{ start: "2026-10-07", count: 1 }, { start: "2026-10-14", count: 1 }].map((w, i) => (i === 0 ? { start: w.start, count: 2 } : w)));
  });
  it("sin entregas todo en cero", () => {
    assert.deepEqual(workload([], "2026-10-07", 2, 6), { peak: 0, peakStart: null, over: false, weeks: [{ start: "2026-10-07", count: 0 }, { start: "2026-10-14", count: 0 }] });
  });
});
