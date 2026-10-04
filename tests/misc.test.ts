import { test } from "node:test";
import assert from "node:assert/strict";
import { creatorKind, isCreatorKind, kindInfo } from "../lib/creator-kind";
import { clientIp, tooManyAttempts } from "../lib/rate-limit";
import { aiMonthlyLimit } from "../lib/ai";

test("tipo de creador con valor por defecto", () => {
  assert.equal(isCreatorKind("ugc"), true);
  assert.equal(isCreatorKind("otro"), false);
  assert.equal(creatorKind(null), "contenido");
  assert.equal(kindInfo("ambos").roleEn, "content & UGC creator");
});

test("rate limit por clave", () => {
  const key = `t-${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(tooManyAttempts(key, 3), false);
  assert.equal(tooManyAttempts(key, 3), true);
  assert.equal(tooManyAttempts(`${key}-otra`, 3), false);
});

test("clientIp toma la primera IP", () => {
  assert.equal(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } })), "1.2.3.4");
  assert.equal(clientIp(new Request("http://x")), "local");
});

test("tope mensual de IA por plan y por variable de entorno", () => {
  assert.equal(aiMonthlyLimit("folio"), 60);
  assert.equal(aiMonthlyLimit("pro"), 300);
  assert.equal(aiMonthlyLimit("folio", true), 1000);
  assert.equal(aiMonthlyLimit("desconocido"), 300);
  process.env.AI_MONTHLY_LIMIT_FOLIO = "5";
  assert.equal(aiMonthlyLimit("folio"), 5);
  process.env.AI_MONTHLY_LIMIT_FOLIO = "abc";
  assert.equal(aiMonthlyLimit("folio"), 60);
  delete process.env.AI_MONTHLY_LIMIT_FOLIO;
});
