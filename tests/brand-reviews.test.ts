import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canReview, hasContactInfo, normalizeBrandKey, summarizeBrand, validateReview, type ReviewRow } from "../lib/brand-reviews";

const row = (id: string, over: Partial<ReviewRow> = {}): ReviewRow => ({ reviewerId: id, payment: "on_time", payDays: 15, rating: 5, comment: "", commentStatus: "none", ...over });

describe("llave de la marca", () => {
  it("junta variantes del mismo nombre", () => {
    assert.equal(normalizeBrandKey("Sol Skincare"), "solskincare");
    assert.equal(normalizeBrandKey(" SOL  skincare! "), "solskincare");
    assert.equal(normalizeBrandKey("Café Ñandú"), "cafenandu");
  });
});

describe("resumen y anonimato", () => {
  it("con menos de 3 personas no muestra nada, ni siquiera cuántas hay", () => {
    assert.deepEqual(summarizeBrand([row("a"), row("b")]), { visible: false });
    assert.deepEqual(summarizeBrand([]), { visible: false });
  });
  it("una persona que reseña dos veces cuenta una sola vez", () => {
    assert.equal(summarizeBrand([row("a"), row("a"), row("b")]).visible, false);
  });
  it("con 3 calcula promedio, porcentajes y mediana de días", () => {
    const s = summarizeBrand([row("a", { rating: 5, payDays: 10 }), row("b", { rating: 4, payment: "late", payDays: 40 }), row("c", { rating: 3, payment: "unpaid", payDays: null })]);
    assert.equal(s.visible, true);
    assert.equal(s.count, 3);
    assert.equal(s.avgRating, 4);
    assert.equal(s.onTimePct, 33);
    assert.equal(s.latePct, 33);
    assert.equal(s.unpaidPct, 33);
    assert.equal(s.medianPayDays, 25);
  });
  it("solo muestra comentarios aprobados, sin orden de llegada", () => {
    const s = summarizeBrand([
      row("a", { comment: "Zeta", commentStatus: "approved" }),
      row("b", { comment: "Alfa", commentStatus: "approved" }),
      row("c", { comment: "Pendiente", commentStatus: "pending" }),
      row("d", { comment: "Oculto", commentStatus: "hidden" }),
    ]);
    assert.deepEqual(s.comments, ["Alfa", "Zeta"]);
  });
});

describe("validación", () => {
  it("acepta una reseña de hechos", () => {
    assert.deepEqual(validateReview({ payment: "late", payDays: 45, rating: 3, comment: " Tardaron en aprobar " }), { ok: true, payment: "late", payDays: 45, rating: 3, comment: "Tardaron en aprobar" });
  });
  it("rechaza lo inválido", () => {
    assert.deepEqual(validateReview({ payment: "x", rating: 3 }), { ok: false, reason: "payment" });
    assert.deepEqual(validateReview({ payment: "late", rating: 6 }), { ok: false, reason: "rating" });
    assert.deepEqual(validateReview({ payment: "late", rating: 3, payDays: -1 }), { ok: false, reason: "payDays" });
    assert.deepEqual(validateReview({ payment: "late", rating: 3, comment: "a".repeat(501) }), { ok: false, reason: "comment" });
  });
  it("no guarda días si no pagó", () => {
    const r = validateReview({ payment: "unpaid", payDays: 30, rating: 1 });
    assert.ok(r.ok && r.payDays === null);
  });
  it("rechaza correos, teléfonos y enlaces en el comentario", () => {
    assert.equal(hasContactInfo("escríbele a ana@marca.com"), true);
    assert.equal(hasContactInfo("llama al +1 (555) 123-4567"), true);
    assert.equal(hasContactInfo("mira https://x.com/foo"), true);
    assert.equal(hasContactInfo("pagaron en 20 días y fueron amables"), false);
    assert.deepEqual(validateReview({ payment: "late", rating: 2, comment: "mail ana@marca.com" }), { ok: false, reason: "contact" });
  });
});

describe("quién puede reseñar", () => {
  const now = new Date("2026-10-20T00:00:00Z");
  const base = { emailVerified: true, accountCreatedAt: new Date("2026-09-01T00:00:00Z"), active: true, muted: false };
  it("cuenta activa, verificada y con antigüedad", () => assert.deepEqual(canReview(base, now), { ok: true }));
  it("rechaza por correo, antigüedad, pausa o sanción", () => {
    assert.deepEqual(canReview({ ...base, emailVerified: false }, now), { ok: false, reason: "email" });
    assert.deepEqual(canReview({ ...base, accountCreatedAt: new Date("2026-10-18T00:00:00Z") }, now), { ok: false, reason: "age" });
    assert.deepEqual(canReview({ ...base, active: false }, now), { ok: false, reason: "inactive" });
    assert.deepEqual(canReview({ ...base, muted: true }, now), { ok: false, reason: "muted" });
  });
});
