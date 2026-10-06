import { randomBytes } from "node:crypto";
import { prismaRoot } from "./prisma-root";
import { logPlatformAction } from "./platform-admin";
import { cookies } from "next/headers";
import { REF_COOKIE, codeFromBytes, normalizeReferralCode } from "./ambassadors";

/** Un código nuevo que no usa nadie todavía (casi siempre sale a la primera: son ~10^11 combinaciones). */
async function freshReferralCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = codeFromBytes(randomBytes(8));
    const taken = await prismaRoot.creator.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("No se pudo crear un código de referidos único");
}

/**
 * Da o quita el nivel Embajadora a una cuenta (solo lo hace el equipo de Foliocrew).
 * Al darlo se crea su código (una sola vez: no cambia aunque cambie el slug). Al quitarlo la cuenta vuelve a su plan
 * normal; los meses que ya había ganado se conservan (viven en paidUntil) y el código se guarda por si vuelve.
 */
export async function setAmbassador(creatorId: string, on: boolean, actorEmail: string) {
  const creator = await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { ambassador: true, ambassadorSince: true, referralCode: true } });
  if (!creator || creator.ambassador === on) return;
  await prismaRoot.creator.update({
    where: { id: creatorId },
    data: on
      ? {
          ambassador: true,
          ambassadorSource: "invited",
          ambassadorSince: creator.ambassadorSince ?? new Date(),
          referralCode: creator.referralCode ?? (await freshReferralCode()),
        }
      : { ambassador: false },
  });
  await logPlatformAction(actorEmail, on ? "ambassador-on" : "ambassador-off", creatorId);
}

/** La embajadora activa dueña de un código (o null si el código no existe, ya no es embajadora o la cuenta está pausada). */
export async function ambassadorByCode(raw: string | null | undefined) {
  const code = normalizeReferralCode(raw);
  if (!code) return null;
  const owner = await prismaRoot.creator.findFirst({ where: { referralCode: code, ambassador: true, status: "active" }, select: { id: true } });
  return owner ? { code, referrerId: owner.id } : null;
}

/** El enlace con el que llega quien se está registrando: primero el de la dirección (?ref=), si no el de la cookie. */
export async function incomingReferral(fromUrl?: string | null) {
  const fromCookie = (await cookies()).get(REF_COOKIE)?.value;
  return (await ambassadorByCode(fromUrl)) ?? (await ambassadorByCode(fromCookie));
}

/** Anota que una cuenta nueva llegó por el enlace de una embajadora (una cuenta solo puede ser referida una vez). */
export async function recordReferral(referrerId: string, referredId: string) {
  if (referrerId === referredId) return;
  await prismaRoot.referral.create({ data: { referrerId, referredId } }).catch((error) => console.error("No se pudo anotar el referido", error));
}

export interface ReferralStats {
  /** Cuentas que se registraron con su enlace (todas, incluso las que ya pagaron o se fueron). */
  registered: number;
  /** Las que ya hicieron su primer pago confirmado (pagaron, se les dio la recompensa o se fueron después). */
  paying: number;
  /** Meses gratis que ya ganó. */
  monthsEarned: number;
}

/** Los números de una embajadora (solo cantidades: nunca nombres ni correos de quien registró). */
export async function referralStats(referrerId: string): Promise<ReferralStats> {
  const rows = await prismaRoot.referral.groupBy({ by: ["status"], where: { referrerId }, _count: { _all: true }, _sum: { rewardMonths: true } });
  const count = (status: string) => rows.find((r) => r.status === status)?._count._all ?? 0;
  const registered = rows.reduce((sum, r) => sum + r._count._all, 0);
  return {
    registered,
    paying: count("paid") + count("rewarded"),
    monthsEarned: rows.reduce((sum, r) => sum + (r._sum.rewardMonths ?? 0), 0),
  };
}
