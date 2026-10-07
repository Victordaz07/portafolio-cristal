import { test } from "node:test";
import assert from "node:assert/strict";
import {
  base32Decode,
  base32Encode,
  formatSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  looksLikeRecoveryCode,
  otpauthUrl,
  totpCode,
  totpStep,
  verifyTotp,
} from "../lib/totp";
import { afterFailure, isLocked, LOCK_MINUTES, MAX_FAILED_LOGINS, sameOrigin } from "../lib/login-guard";

// Clave de los ejemplos del estándar (RFC 6238, apéndice B): "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));

test("base32 ida y vuelta", () => {
  assert.equal(RFC_SECRET, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.equal(base32Decode(RFC_SECRET).toString(), "12345678901234567890");
  assert.equal(base32Decode("gezd gnbv-GY3T qojq").toString(), "1234567890");
  assert.throws(() => base32Decode("no!vale"));
  const secret = generateTotpSecret();
  assert.equal(secret.length, 32);
  assert.equal(base32Decode(secret).length, 20);
  assert.equal(formatSecret("ABCDEFGH"), "ABCD EFGH");
});

test("TOTP: coincide con los ejemplos del RFC 6238 (SHA-1, 6 dígitos)", () => {
  const cases: [number, string][] = [
    [59, "287082"],
    [1111111109, "081804"],
    [1234567890, "005924"],
    [2000000000, "279037"],
  ];
  for (const [seconds, code] of cases) assert.equal(totpCode(RFC_SECRET, totpStep(seconds * 1000)), code);
});

test("verifyTotp: acepta el intervalo actual y los vecinos, rechaza el resto y los repetidos", () => {
  const now = 1234567890 * 1000;
  const step = totpStep(now);
  assert.equal(verifyTotp(RFC_SECRET, "005924", { now }), step);
  assert.equal(verifyTotp(RFC_SECRET, " 005 924 ", { now }), step);
  assert.equal(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 1), { now }), step - 1);
  assert.equal(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 1), { now }), step + 1);
  assert.equal(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 2), { now }), null);
  assert.equal(verifyTotp(RFC_SECRET, "000000", { now }), null);
  assert.equal(verifyTotp(RFC_SECRET, "12345", { now }), null);
  assert.equal(verifyTotp(RFC_SECRET, "abcdef", { now }), null);
  // Un código ya usado no vale otra vez.
  assert.equal(verifyTotp(RFC_SECRET, "005924", { now, lastStep: step }), null);
  assert.equal(verifyTotp(RFC_SECRET, "005924", { now, lastStep: step - 1 }), step);
});

test("enlace otpauth para el QR", () => {
  const raw = otpauthUrl("Foliocrew", "ana+1@correo.com", "ABC");
  assert.ok(raw.startsWith("otpauth://totp/Foliocrew:ana%2B1%40correo.com?"));
  const url = new URL(raw);
  assert.equal(url.searchParams.get("secret"), "ABC");
  assert.equal(url.searchParams.get("issuer"), "Foliocrew");
});

test("códigos de recuperación: 8 distintos, se comparan sin importar guiones ni mayúsculas", () => {
  const codes = generateRecoveryCodes();
  assert.equal(codes.length, 8);
  assert.equal(new Set(codes).size, 8);
  for (const code of codes) {
    assert.match(code, /^[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}$/);
    assert.equal(looksLikeRecoveryCode(code), true);
    assert.equal(hashRecoveryCode(code), hashRecoveryCode(code.toLowerCase().replace("-", " ")));
  }
  assert.notEqual(hashRecoveryCode(codes[0]), hashRecoveryCode(codes[1]));
  assert.equal(looksLikeRecoveryCode("123456"), false);
  assert.equal(looksLikeRecoveryCode("1234567890"), false);
});

test("bloqueo por intentos fallidos", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  assert.deepEqual(afterFailure(MAX_FAILED_LOGINS - 1, now), { failedLogins: MAX_FAILED_LOGINS - 1, lockedUntil: null });
  const locked = afterFailure(MAX_FAILED_LOGINS, now);
  assert.equal(locked.failedLogins, 0);
  assert.equal(locked.lockedUntil!.getTime() - now.getTime(), LOCK_MINUTES * 60_000);
  assert.equal(isLocked(locked.lockedUntil, now), true);
  assert.equal(isLocked(locked.lockedUntil, new Date(now.getTime() + LOCK_MINUTES * 60_000 + 1)), false);
  assert.equal(isLocked(null, now), false);
});

test("control de origen de las APIs del panel", () => {
  const hosts = ["foliocrew.pro", null];
  assert.equal(sameOrigin(null, hosts), true);
  assert.equal(sameOrigin("https://foliocrew.pro", hosts), true);
  assert.equal(sameOrigin("https://FOLIOCREW.pro", hosts), true);
  assert.equal(sameOrigin("https://cristal.foliocrew.pro", hosts), false);
  assert.equal(sameOrigin("https://malo.com", hosts), false);
  assert.equal(sameOrigin("null", hosts), false);
  assert.equal(sameOrigin("http://localhost:3000", ["localhost:3000"]), true);
});
