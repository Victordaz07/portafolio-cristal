// Programa de Embajadoras (docs/plan-embajadores.md): nivel por invitación que no se compra.
// Aquí viven los parámetros y la lógica pura (se prueba en tests/ambassadors.test.ts).
// La activación (base de datos) está en lib/ambassadors-server.ts.

export const AMBASSADOR = {
  /** Meses gratis por cada referido que paga. */
  rewardMonths: 1,
  /** Días que se espera después de su primer pago confirmado antes de dar la recompensa. */
  waitDays: 30,
  /** Referidos pagados para ganarse el nivel solo (se prende más adelante). */
  meritThreshold: 5,
  /** Cuánto dura la cookie del enlace. */
  cookieDays: 30,
} as const;

/** Cookie donde se guarda el código del enlace (httpOnly, AMBASSADOR.cookieDays días). */
export const REF_COOKIE = "fc_ref";

/** Sin 0/O, 1/I/L: se lee y se dicta sin confundirse. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERRAL_CODE_LENGTH = 8;

/** Convierte bytes al azar en un código de 8 letras/números (el azar lo pone quien llama). */
export function codeFromBytes(bytes: ArrayLike<number>) {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return code;
}

/** Deja el código como se guarda (mayúsculas, sin espacios ni guiones); null si no puede ser un código. */
export function normalizeReferralCode(input: string | null | undefined) {
  const code = (input ?? "").toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== REFERRAL_CODE_LENGTH) return null;
  for (const char of code) if (!CODE_ALPHABET.includes(char)) return null;
  return code;
}

/** El enlace que comparte la embajadora. */
export const referralLink = (origin: string, code: string) => `${origin.replace(/\/$/, "")}/?ref=${code}`;

/** El plan que cuenta para funciones y límites: la embajadora tiene como mínimo Folio Pro. */
export function effectivePlanId(plan: string, ambassador: boolean) {
  return ambassador && plan !== "crew" ? "pro" : plan;
}

/** ¿Ya pasó la espera para darle la recompensa por un referido que pagó? */
export function rewardDue(paidAt: Date | null, now = new Date()) {
  if (!paidAt) return false;
  return now.getTime() - paidAt.getTime() >= AMBASSADOR.waitDays * 86_400_000;
}
