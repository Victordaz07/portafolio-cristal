import { randomBytes } from "node:crypto";
import { prismaRoot } from "./prisma-root";
import { logPlatformAction } from "./platform-admin";
import { cookies } from "next/headers";
import { AMBASSADOR, REF_COOKIE, codeFromBytes, normalizeReferralCode, rewardDecision } from "./ambassadors";
import { billingState, extendPaidUntil } from "./billing";
import { sendEmail } from "./email";
import { ambassadorRewardEmail } from "./email-templates";
import { asMailLang } from "./email-lang";
import { platformOrigin } from "./site-url";

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

/**
 * Se llama al confirmar un pago: el primer pago confirmado de una cuenta referida pasa su Referral a "paid".
 * No cuentan los pagos en cero ni las cuentas de cortesía o embajadoras. Nunca rompe la confirmación del pago.
 */
export async function markReferralPaid(creatorId: string, amountCents: number, now = new Date()) {
  try {
    if (amountCents <= 0) return;
    const referred = await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { comp: true, ambassador: true } });
    if (!referred || referred.comp || referred.ambassador) return;
    await prismaRoot.referral.updateMany({ where: { referredId: creatorId, status: "signed_up" }, data: { status: "paid", paidAt: now } });
  } catch (error) {
    console.error("No se pudo marcar el referido como pagado", error);
  }
}

/**
 * Recompensas diarias (dentro del cron de cobros): a los AMBASSADOR.waitDays días del primer pago de un referido, si su
 * cuenta sigue activa y con plan pagado, la embajadora gana AMBASSADOR.rewardMonths mes(es) gratis (se suman a su "pagado hasta").
 * Si la cuenta referida se pausó o ya no paga queda "churned". Cada referido se premia una sola vez.
 */
export async function grantAmbassadorRewards(now = new Date()) {
  const cutoff = new Date(now.getTime() - AMBASSADOR.waitDays * 86_400_000);
  const pending = await prismaRoot.referral.findMany({
    where: { status: "paid", paidAt: { lte: cutoff } },
    include: {
      referred: { select: { slug: true, status: true, plan: true, comp: true, ambassador: true, trialEndsAt: true, paidUntil: true } },
      referrer: { select: { id: true, status: true, ambassador: true, paidUntil: true } },
    },
    take: 200,
  });
  let rewarded = 0;
  let churned = 0;
  for (const referral of pending) {
    try {
      const decision = rewardDecision({
        paidAt: referral.paidAt,
        now,
        referredActive: referral.referred.status === "active",
        referredPaying: billingState(referral.referred, now).state === "active",
        referrerAmbassador: referral.referrer.ambassador,
        referrerActive: referral.referrer.status === "active",
      });
      if (decision === "churned") {
        const result = await prismaRoot.referral.updateMany({ where: { id: referral.id, status: "paid" }, data: { status: "churned" } });
        churned += result.count;
        continue;
      }
      if (decision !== "reward") continue;
      const granted = await prismaRoot.$transaction(async (tx) => {
        // El cambio de estado es la "cerradura": si otra ejecución ya lo premió, no se vuelve a sumar.
        const claim = await tx.referral.updateMany({
          where: { id: referral.id, status: "paid" },
          data: { status: "rewarded", rewardedAt: now, rewardMonths: AMBASSADOR.rewardMonths },
        });
        if (claim.count !== 1) return false;
        const current = await tx.creator.findUniqueOrThrow({ where: { id: referral.referrerId }, select: { paidUntil: true } });
        await tx.creator.update({ where: { id: referral.referrerId }, data: { paidUntil: extendPaidUntil(current.paidUntil, AMBASSADOR.rewardMonths, now) } });
        return true;
      });
      if (!granted) continue;
      rewarded += 1;
      await logPlatformAction("sistema", "ambassador-reward", referral.referrerId, `+${AMBASSADOR.rewardMonths} mes por ${referral.referred.slug}`);
      await notifyAmbassadorReward(referral.referrerId);
    } catch (error) {
      console.error("Falló una recompensa de embajadora", referral.id, error);
    }
  }
  return { rewarded, churned };
}

async function notifyAmbassadorReward(referrerId: string) {
  const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId: referrerId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true, language: true } });
  if (!owner) return;
  const origin = await platformOrigin();
  const mail = ambassadorRewardEmail({ lang: asMailLang(owner.language), origin, name: owner.name, months: AMBASSADOR.rewardMonths, panelUrl: `${origin}/admin/embajadora` });
  await sendEmail({ to: owner.email, ...mail });
}
