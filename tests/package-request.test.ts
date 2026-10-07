import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dealStatusAfterRequest, formatPriceFrom, packageRequestSchema, requestSummary } from "../lib/package-request";

const valid = { packageId: "pkg1", brandName: "Sol Skincare", contactName: "Ana", email: "ana@sol.com", brief: "3 reels de rutina de noche", lang: "es" as const };

describe("precio «desde»", () => {
  it("formatea en español e inglés", () => {
    assert.equal(formatPriceFrom(500, "USD", "es"), "Desde US$500");
    assert.equal(formatPriceFrom(1500, "USD", "en"), "From US$1,500");
    assert.equal(formatPriceFrom(800, "EUR", "es"), "Desde 800 EUR");
  });
  it("sin precio no muestra nada", () => {
    assert.equal(formatPriceFrom(null, "USD", "es"), null);
    assert.equal(formatPriceFrom(0, "USD", "es"), null);
    assert.equal(formatPriceFrom(undefined, undefined, "en"), null);
  });
});

describe("solicitud de un paquete", () => {
  it("acepta lo mínimo y una solicitud completa", () => {
    assert.ok(packageRequestSchema.safeParse(valid).success);
    assert.ok(packageRequestSchema.safeParse({ ...valid, startDate: "2026-11-01", endDate: "2026-11-30", budget: 800, startDate2: "x" }).success);
  });
  it("rechaza correo inválido, brief vacío y presupuesto negativo o enorme", () => {
    assert.equal(packageRequestSchema.safeParse({ ...valid, email: "no-es-correo" }).success, false);
    assert.equal(packageRequestSchema.safeParse({ ...valid, brief: "   " }).success, false);
    assert.equal(packageRequestSchema.safeParse({ ...valid, budget: -5 }).success, false);
    assert.equal(packageRequestSchema.safeParse({ ...valid, budget: 5_000_000 }).success, false);
    assert.equal(packageRequestSchema.safeParse({ ...valid, budget: 10.5 }).success, false);
  });
  it("rechaza fechas inválidas y una entrega antes del inicio", () => {
    assert.equal(packageRequestSchema.safeParse({ ...valid, startDate: "mañana" }).success, false);
    assert.equal(packageRequestSchema.safeParse({ ...valid, startDate: "2026-13-45" }).success, false);
    assert.equal(packageRequestSchema.safeParse({ ...valid, startDate: "2026-11-30", endDate: "2026-11-01" }).success, false);
    assert.ok(packageRequestSchema.safeParse({ ...valid, startDate: "", endDate: "" }).success);
  });
  it("recorta espacios y limita el largo", () => {
    assert.equal(packageRequestSchema.parse({ ...valid, brandName: "  Sol  " }).brandName, "Sol");
    assert.equal(packageRequestSchema.safeParse({ ...valid, brief: "a".repeat(3001) }).success, false);
  });
  it("el resumen cuenta lo que pidió la marca", () => {
    const s = requestSummary({ packageName: "Pack Reels", budget: 800, currency: "USD", startDate: "2026-11-01", endDate: "2026-11-30", lang: "es" });
    assert.equal(s, "Paquete: Pack Reels · Presupuesto: US$800 · Fechas: del 2026-11-01 al 2026-11-30");
    assert.equal(requestSummary({ packageName: "Reels", lang: "en" }), "Package: Reels");
    assert.match(requestSummary({ packageName: "Reels", endDate: "2026-12-01", lang: "en" }), /Deadline: 2026-12-01/);
  });
});

describe("estado del trato tras una solicitud", () => {
  it("un prospecto, una marca solo de portafolio o un trato terminado pasan a negociación", () => {
    assert.equal(dealStatusAfterRequest(null), "negotiating");
    assert.equal(dealStatusAfterRequest("prospect"), "negotiating");
    assert.equal(dealStatusAfterRequest("completed"), "negotiating");
  });
  it("un trato en curso no se toca", () => {
    assert.equal(dealStatusAfterRequest("active"), "active");
    assert.equal(dealStatusAfterRequest("negotiating"), "negotiating");
  });
});
