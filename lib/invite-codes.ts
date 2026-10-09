import { randomInt } from "node:crypto";
import { prismaRoot } from "./prisma-root";

// Códigos de invitación guardados en la base (alternativa a SIGNUP_INVITE_CODE, el código único
// de Vercel, que sigue funcionando igual). Mismo alfabeto que lib/access-code.ts: sin letras ni
// números que se confundan (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode() {
  const pick = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick()}-${pick()}`;
}

/** Acepta con o sin guiones/espacios y mayúsculas/minúsculas; siempre se guarda y compara en mayúsculas. */
export function normalizeInviteCode(input: string) {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : input.trim().toUpperCase();
}

/** ¿Hay al menos un código utilizable ahora mismo? (para el aviso de "registro abierto"). */
export async function hasActiveInviteCodes(now = new Date()) {
  const codes = await prismaRoot.inviteCode.findMany({
    where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { maxUses: true, usedCount: true },
  });
  return codes.some((c) => c.maxUses === null || c.usedCount < c.maxUses);
}

/** Intenta canjear un código. Si sirve, suma un uso (de forma atómica) y devuelve true. */
export async function redeemInviteCode(raw: string, now = new Date()) {
  const code = normalizeInviteCode(raw);
  const record = await prismaRoot.inviteCode.findUnique({ where: { code } });
  if (!record || !record.active) return false;
  if (record.expiresAt && record.expiresAt <= now) return false;
  if (record.maxUses !== null && record.usedCount >= record.maxUses) return false;

  const where = record.maxUses !== null ? { id: record.id, usedCount: { lt: record.maxUses } } : { id: record.id };
  const result = await prismaRoot.inviteCode.updateMany({ where, data: { usedCount: { increment: 1 } } });
  return result.count === 1;
}
