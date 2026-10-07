import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildReportData, compare, isDelivered, median, normalizeUrl, publicReport, reportTotals, type CardRow, type DeliverableRow } from "../lib/campaign-report";

const card = (id: string, over: Partial<CardRow> = {}): CardRow => ({
  id, platform: "instagram", postUrl: `https://instagram.com/reel/${id}/`, thumbnailUrl: null, caption: `Reel ${id}\nsegunda línea`,
  views: 1000, likes: 80, comments: 10, shares: 5, saves: 5, topComment: null, topCommentAuthor: null, ...over,
});
const base = (n: number, views = 500) => Array.from({ length: n }, () => ({ views, likes: 25, comments: 2, shares: 1, saves: 2 }));

describe("armar los datos", () => {
  it("convierte las publicaciones de la marca y usa la primera línea como título", () => {
    const d = buildReportData({ cards: [card("a")], deliverables: [], baselineCards: [] });
    assert.equal(d.posts.length, 1);
    assert.equal(d.posts[0].title, "Reel a");
    assert.equal(d.posts[0].key, "c:a");
    assert.equal(d.posts[0].include, true);
  });
  it("une un entregable con su publicación si tienen el mismo enlace (sin ?, # ni barra final)", () => {
    const del: DeliverableRow = { id: "d1", title: "Reel de rutina", network: "instagram", proofUrl: "https://www.Instagram.com/reel/a?utm=1", status: "published" };
    const d = buildReportData({ cards: [card("a")], deliverables: [del], baselineCards: [] });
    assert.equal(d.posts.length, 1);
    assert.equal(d.posts[0].title, "Reel de rutina");
    assert.equal(d.posts[0].views, 1000);
  });
  it("un entregable publicado sin publicación en el Feed entra sin números", () => {
    const del: DeliverableRow = { id: "d2", title: "Set de fotos", network: "ugc", proofUrl: "https://drive.example/set", status: "approved" };
    const d = buildReportData({ cards: [], deliverables: [del], baselineCards: [] });
    assert.equal(d.posts.length, 1);
    assert.equal(d.posts[0].key, "d:d2");
    assert.equal(d.posts[0].views, null);
  });
  it("ignora entregables sin terminar o con enlaces que no son http(s)", () => {
    const todo: DeliverableRow = { id: "x", title: "x", network: null, proofUrl: "https://a.example/x", status: "todo" };
    const bad: DeliverableRow = { id: "y", title: "y", network: null, proofUrl: "javascript:alert(1)", status: "published" };
    assert.equal(isDelivered(todo), false);
    assert.equal(isDelivered(bad), false);
    assert.equal(buildReportData({ cards: [], deliverables: [todo, bad], baselineCards: [] }).posts.length, 0);
  });
  it("una publicación con enlace raro no deja un enlace peligroso en el reporte", () => {
    const d = buildReportData({ cards: [card("a", { postUrl: "javascript:alert(1)", thumbnailUrl: "data:image/png;base64,AAA" })], deliverables: [], baselineCards: [] });
    assert.equal(d.posts[0].url, null);
    assert.equal(d.posts[0].thumbnailUrl, null);
  });
  it("al actualizar conserva qué publicaciones se habían dejado fuera", () => {
    const first = buildReportData({ cards: [card("a"), card("b")], deliverables: [], baselineCards: [] });
    first.posts[1].include = false;
    const again = buildReportData({ cards: [card("a"), card("b"), card("c")], deliverables: [], baselineCards: [], previous: first });
    assert.deepEqual(again.posts.map((p) => p.include), [true, false, true]);
  });
  it("la base de comparación necesita al menos 3 publicaciones", () => {
    assert.equal(buildReportData({ cards: [], deliverables: [], baselineCards: base(2) }).baseline, null);
    const b = buildReportData({ cards: [], deliverables: [], baselineCards: base(3) }).baseline;
    assert.equal(b?.posts, 3);
    assert.equal(b?.medianViews, 500);
  });
});

describe("totales y comparación", () => {
  it("suma solo las publicaciones incluidas", () => {
    const d = buildReportData({ cards: [card("a"), card("b", { views: 3000 })], deliverables: [], baselineCards: [] });
    d.posts[1].include = false;
    const t = reportTotals(d.posts);
    assert.equal(t.posts, 1);
    assert.equal(t.views, 1000);
    assert.equal(t.engagement, 10);
  });
  it("sin ningún dato de una métrica el total es null (no 0)", () => {
    const d = buildReportData({ cards: [card("a", { shares: null, saves: null })], deliverables: [], baselineCards: [] });
    assert.equal(reportTotals(d.posts).shares, null);
  });
  it("compara con la vista mediana de su base", () => {
    const d = buildReportData({ cards: [card("a", { views: 1500 })], deliverables: [], baselineCards: base(5, 500) });
    const c = compare(d.posts, d.baseline);
    assert.equal(c?.viewsRatio, 3);
    assert.equal(c?.medianViews, 500);
  });
  it("sin base suficiente no hay comparación", () => {
    const d = buildReportData({ cards: [card("a")], deliverables: [], baselineCards: base(1) });
    assert.equal(compare(d.posts, d.baseline), null);
  });
  it("mediana de pares y de listas vacías", () => {
    assert.equal(median([]), null);
    assert.equal(median([1, 3]), 2);
    assert.equal(median([5, 1, 3]), 3);
  });
  it("normaliza enlaces", () => {
    assert.equal(normalizeUrl("HTTPS://www.Instagram.com/reel/AbC/?x=1#y"), "instagram.com/reel/abc");
    assert.equal(normalizeUrl(null), null);
  });
});

describe("lo que ve la marca", () => {
  const data = () => buildReportData({ cards: [card("a", { topComment: "¡Me encantó!", topCommentAuthor: "@fan" }), card("b")], deliverables: [], baselineCards: base(4, 500) });
  it("sin nada oculto muestra todo", () => {
    const r = publicReport(data(), []);
    assert.equal(r.posts.length, 2);
    assert.equal(r.totals.views, 2000);
    assert.ok(r.totals.engagement != null);
    assert.ok(r.comparison?.viewsRatio);
    assert.deepEqual(r.topComments, [{ text: "¡Me encantó!", author: "@fan" }]);
  });
  it("una métrica oculta NO aparece ni en el total ni en cada publicación ni en la comparación", () => {
    const r = publicReport(data(), ["views"]);
    assert.equal("views" in r.totals, false);
    assert.equal("views" in r.posts[0].metrics, false);
    assert.equal(r.comparison?.viewsRatio, null);
    assert.equal(r.comparison?.avgViews, null);
    assert.ok(r.totals.likes != null);
    assert.equal(JSON.stringify(r).includes('"views"'), false);
  });
  it("ocultar engagement lo quita de todas partes", () => {
    const r = publicReport(data(), ["engagement"]);
    assert.equal("engagement" in r.totals, false);
    assert.equal("engagement" in r.posts[0].metrics, false);
    assert.equal(r.comparison?.engagement, null);
    assert.ok(r.comparison?.viewsRatio);
  });
  it("ocultar «comparison» quita la comparación y «topComments» los comentarios", () => {
    const r = publicReport(data(), ["comparison", "topComments"]);
    assert.equal(r.comparison, null);
    assert.deepEqual(r.topComments, []);
  });
  it("si todo lo comparable está oculto, no queda una comparación vacía", () => {
    assert.equal(publicReport(data(), ["views", "engagement"]).comparison, null);
  });
  it("las publicaciones dejadas fuera no aparecen ni en los comentarios", () => {
    const d = data();
    d.posts[0].include = false;
    const r = publicReport(d, []);
    assert.equal(r.posts.length, 1);
    assert.deepEqual(r.topComments, []);
  });
  it("no filtra datos internos (claves, ids, borradores)", () => {
    const text = JSON.stringify(publicReport(data(), []));
    assert.equal(text.includes("c:a"), false);
    assert.equal(text.includes("include"), false);
    assert.equal(text.includes("builtAt"), false);
  });
});
