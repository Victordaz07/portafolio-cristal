import { randomInt } from "node:crypto";

// Código de acceso para creadoras de una agencia (plan Crew): entran con su correo y este código
// en vez de su contraseña, desde la landing de su agencia. Puerto directo del de Peekmedia
// (src/lib/access-code.ts) — mismo alfabeto, sin letras ni números que se confundan (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Código legible "XXXX-XXXX-XXXX" (~59 bits). */
export function generateAccessCode() {
  const pick = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick()}-${pick()}-${pick()}`;
}

/** Acepta "abcd efgh ijkl", "ABCDEFGHIJKL" o con guiones y lo lleva al formato del código. */
export function normalizeAccessCode(input: string) {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length === 12) return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
  return input.trim();
}
