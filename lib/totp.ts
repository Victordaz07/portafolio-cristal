import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// Verificación en dos pasos con códigos de 6 dígitos (TOTP, RFC 6238): los mismos que generan
// Google Authenticator, Authy, 1Password o la app Contraseñas del iPhone. Sin dependencias: solo
// node:crypto. Este archivo no toca la base de datos (ver lib/two-factor.ts).

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

export function base32Encode(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string) {
  const clean = text.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Clave base32 inválida");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Clave nueva de 160 bits (lo que recomienda el estándar), en base32. */
export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

/** "ABCD EFGH IJKL …": para escribirla a mano si no se puede escanear el QR. */
export function formatSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export const totpStep = (now: number = Date.now()) => Math.floor(now / 1000 / STEP_SECONDS);

/** El código de 6 dígitos de un intervalo de 30 segundos. */
export function totpCode(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

const equal = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Comprueba un código. Acepta el intervalo actual y uno antes o después (relojes desajustados).
 * Devuelve el intervalo que coincidió, o null. `lastStep` es el último intervalo ya usado: un código
 * no vale dos veces, así que no sirve de nada copiarlo mirando por encima del hombro.
 */
export function verifyTotp(secret: string, code: string, opts: { now?: number; lastStep?: number | null } = {}) {
  const digits = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(digits)) return null;
  const current = totpStep(opts.now);
  for (const step of [current, current - 1, current + 1]) {
    if (opts.lastStep != null && step <= opts.lastStep) continue;
    if (equal(totpCode(secret, step), digits)) return step;
  }
  return null;
}

/** Enlace que leen las apps de autenticación (es lo que va dentro del código QR). */
export function otpauthUrl(issuer: string, account: string, secret: string) {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

// ─── Códigos de recuperación (por si se pierde el teléfono) ───

export const RECOVERY_CODE_COUNT = 8;
// Sin 0/O ni 1/I/L: se leen y se copian a mano sin confundirse.
const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** 8 códigos de un solo uso, tipo "K7QM-2XPD" (unos 49 bits cada uno). */
export function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const chars = Array.from({ length: 10 }, () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)]).join("");
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

const normalizeRecovery = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** En la base solo se guarda el hash: si alguien la lee, no puede usar los códigos. */
export function hashRecoveryCode(code: string) {
  return createHash("sha256").update(`recovery:${normalizeRecovery(code)}`).digest("hex");
}

/** ¿Lo que escribió parece un código de recuperación (y no uno de 6 dígitos)? */
export function looksLikeRecoveryCode(code: string) {
  return normalizeRecovery(code).length === 10 && !/^\d+$/.test(normalizeRecovery(code));
}
