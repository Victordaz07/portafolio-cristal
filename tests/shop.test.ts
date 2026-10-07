import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buttonLabel, formatPrice, isSafeBuyUrl, needsAffiliateNotice, relFor, validateProduct } from "../lib/shop";

describe("enlace de compra", () => {
  it("solo https, con dominio y sin credenciales", () => {
    assert.equal(isSafeBuyUrl("https://pay.example.com/buy/abc"), true);
    assert.equal(isSafeBuyUrl("http://pay.example.com"), false);
    assert.equal(isSafeBuyUrl("javascript:alert(1)"), false);
    assert.equal(isSafeBuyUrl("data:text/html,x"), false);
    assert.equal(isSafeBuyUrl("https://user:pw@pay.example.com"), false);
    assert.equal(isSafeBuyUrl("https://localhost"), false);
    assert.equal(isSafeBuyUrl("no es url"), false);
  });
});

describe("precio y botones", () => {
  it("formatea el precio", () => {
    assert.equal(formatPrice(2900, "USD", "en"), "$29");
    assert.equal(formatPrice(2950, "USD", "en"), "$29.50");
    assert.equal(formatPrice(null, "USD", "es"), null);
    assert.equal(formatPrice(0, "USD", "es"), null);
  });
  it("texto del botón por tipo e idioma", () => {
    assert.equal(buttonLabel("digital", "es"), "Comprar");
    assert.equal(buttonLabel("call", "en"), "Book");
    assert.equal(buttonLabel("affiliate", "es"), "Ver oferta");
  });
  it("los afiliados llevan rel=sponsored", () => {
    assert.match(relFor("affiliate"), /sponsored/);
    assert.doesNotMatch(relFor("digital"), /sponsored/);
  });
});

describe("validar producto", () => {
  const ok = { kind: "digital", title: "Presets", priceCents: 1900, buyUrl: "https://pay.example.com/x" };
  it("acepta uno bien hecho", () => assert.deepEqual(validateProduct(ok), { ok: true }));
  it("exige precio en digitales y asesorías, no en afiliados", () => {
    assert.deepEqual(validateProduct({ ...ok, priceCents: null }), { ok: false, reason: "price" });
    assert.deepEqual(validateProduct({ ...ok, kind: "call", priceCents: 0 }), { ok: false, reason: "price" });
    assert.deepEqual(validateProduct({ ...ok, kind: "affiliate", priceCents: null }), { ok: true });
  });
  it("rechaza tipo, título, enlace, moneda o precio inválidos", () => {
    assert.deepEqual(validateProduct({ ...ok, kind: "raro" }), { ok: false, reason: "kind" });
    assert.deepEqual(validateProduct({ ...ok, title: "  " }), { ok: false, reason: "title" });
    assert.deepEqual(validateProduct({ ...ok, buyUrl: "http://x.com" }), { ok: false, reason: "url" });
    assert.deepEqual(validateProduct({ ...ok, currency: "dólar" }), { ok: false, reason: "currency" });
    assert.deepEqual(validateProduct({ ...ok, priceCents: -5 }), { ok: false, reason: "price" });
    assert.deepEqual(validateProduct({ ...ok, description: "x".repeat(601) }), { ok: false, reason: "description" });
  });
});

describe("aviso de afiliados", () => {
  it("se exige solo si hay un afiliado activo", () => {
    assert.equal(needsAffiliateNotice([{ kind: "affiliate", active: true }]), true);
    assert.equal(needsAffiliateNotice([{ kind: "affiliate", active: false }, { kind: "digital", active: true }]), false);
    assert.equal(needsAffiliateNotice([]), false);
  });
});
