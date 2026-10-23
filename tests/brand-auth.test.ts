import { test } from "node:test";
import assert from "node:assert/strict";
import { createBrandSessionToken, verifyBrandSessionToken } from "../lib/brand-auth";

// Sesión de marca: separada de admin_session (lib/auth.ts), nunca lleva creatorId.
process.env.AUTH_SECRET ||= "clave-de-prueba-bien-larga-para-firmar-sesiones";

test("firma y verifica una sesión de marca", async () => {
  const token = await createBrandSessionToken({ brandId: "brand_1", email: "hola@marca.test", sv: 2 });
  const payload = await verifyBrandSessionToken(token);
  assert.equal(payload?.brandId, "brand_1");
  assert.equal(payload?.email, "hola@marca.test");
  assert.equal(payload?.sv, 2);
});

test("un token inválido no verifica", async () => {
  assert.equal(await verifyBrandSessionToken("no-es-un-jwt"), null);
});

test("un token de la sesión de admin (sin brandId) no sirve como sesión de marca", async () => {
  // Simula un JWT con otra forma (userId/creatorId en vez de brandId/email).
  const { SignJWT } = await import("jose");
  const key = new TextEncoder().encode(process.env.AUTH_SECRET);
  const foreign = await new SignJWT({ userId: "u1", creatorId: "c1", email: "x@x.test" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  assert.equal(await verifyBrandSessionToken(foreign), null);
});
