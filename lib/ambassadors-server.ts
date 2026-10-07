import { randomBytes } from "node:crypto";
import { prismaRoot } from "./prisma-root";
import { logPlatformAction } from "./platform-admin";
import { cookies } from "next/headers";
import { AMBASSADOR, REF_COOKIE, codeFromBytes, meritEnabled, meritProgress, normalizeReferralCode, rewardDecision, shouldPromote } from "./ambassadors";
import { billingState, extendPaidUntil } from "./billing";
import { sendEmail } from "./email";
import { ambassadorRewardEmail } from "./email-templates";
import { asMailLang } from "./email-lang";
import { creatorSiteUrl, platformOrigin } from "./site-url";
import { noticeEmail } from "./email-templates";

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

/**
 * Enlace de una cuenta que todavía NO es embajadora (mérito, G5): solo cuenta como atribución, nunca como invitación
 * al registro. Devuelve null si el mérito no está prendido, el código no existe o ya es de una embajadora.
 */
export async function incomingMeritReferral(fromUrl?: string | null) {
  if (!meritEnabled()) return null;
  const code = normalizeReferralCode(fromUrl) ?? normalizeReferralCode((await cookies()).get(REF_COOKIE)?.value);
  if (!code) return null;
  const owner = await prismaRoot.creator.findFirst({ where: { referralCode: code, ambassador: false, status: "active" }, select: { id: true } });
  return owner ? { code, referrerId: owner.id } : null;
}

/** El código de una cuenta (lo crea la primera vez que lo necesita; solo para el mérito). */
export async function ensureReferralCode(creatorId: string) {
  const creator = await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { referralCode: true } });
  if (!creator) return null;
  if (creator.referralCode) return creator.referralCode;
  const code = await freshReferralCode();
  const result = await prismaRoot.creator.updateMany({ where: { id: creatorId, referralCode: null }, data: { referralCode: code } });
  return result.count ? code : (await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { referralCode: true } }))?.referralCode ?? null;
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
    const updated = await prismaRoot.referral.findFirst({ where: { referredId: creatorId, status: "signed_up" }, select: { id: true, referrerId: true } });
    if (!updated) return;
    const result = await prismaRoot.referral.updateMany({ where: { id: updated.id, status: "signed_up" }, data: { status: "paid", paidAt: now } });
    if (result.count) await promoteByMerit(updated.referrerId, now);
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

/**
 * Mérito automático (G5): cuando una cuenta que aún no es embajadora llega a AMBASSADOR.meritThreshold referidos que
 * ya pagaron, sube sola al nivel (fuente «merit»). Solo si el dueño prendió AMBASSADOR_MERIT_ENABLED=1. Nunca lanza.
 * Las recompensas que estaban en espera ("hold") las entrega el cron diario normal al ser ya embajadora.
 */
export async function promoteByMerit(referrerId: string, now = new Date()) {
  try {
    if (!meritEnabled()) return false;
    const creator = await prismaRoot.creator.findUnique({ where: { id: referrerId }, select: { ambassador: true, status: true, ambassadorSince: true, referralCode: true } });
    if (!creator) return false;
    const paidReferrals = await prismaRoot.referral.count({ where: { referrerId, status: { in: ["paid", "rewarded"] } } });
    if (!shouldPromote({ enabled: true, ambassador: creator.ambassador, active: creator.status === "active", paidReferrals })) return false;
    const result = await prismaRoot.creator.updateMany({
      where: { id: referrerId, ambassador: false },
      data: { ambassador: true, ambassadorSource: "merit", ambassadorSince: creator.ambassadorSince ?? now, referralCode: creator.referralCode ?? (await freshReferralCode()) },
    });
    if (!result.count) return false;
    await logPlatformAction("sistema", "ambassador-merit", referrerId, `${paidReferrals} referidos que pagaron`);
    await notifyMerit(referrerId).catch((error) => console.error("No se pudo avisar del mérito", error));
    return true;
  } catch (error) {
    console.error("No se pudo evaluar el mérito de embajadora", error);
    return false;
  }
}

async function notifyMerit(creatorId: string) {
  const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true, language: true } });
  if (!owner) return;
  const lang = asMailLang(owner.language);
  const en = lang === "en";
  const origin = await platformOrigin();
  const mail = noticeEmail({
    lang,
    origin,
    name: owner.name,
    subject: en ? "You're now a Foliocrew ambassador 💜" : "¡Ya eres embajadora de Foliocrew! 💜",
    title: en ? "You earned the Ambassador tier" : "Te ganaste el nivel Embajadora",
    lines: en
      ? [`${AMBASSADOR.meritThreshold} people you invited are now paying members. Thank you for spreading the word!`, "From now on you have Folio Pro with nothing to pay, a badge for your site, and you earn free months for every person you invite who pays."]
      : [`${AMBASSADOR.meritThreshold} personas que invitaste ya pagan su plan. ¡Gracias por correr la voz!`, "Desde hoy tienes Folio Pro sin pagar, una insignia para tu sitio y ganas meses gratis por cada persona que invites y pague."],
    button: { label: en ? "Open my ambassador panel" : "Abrir mi panel de embajadora", url: `${origin}/admin/embajadora` },
  });
  await sendEmail({ to: owner.email, ...mail });
}

/** Progreso de una cuenta hacia el nivel (referidos que ya pagaron). */
export async function meritFor(creatorId: string) {
  const paid = await prismaRoot.referral.count({ where: { referrerId: creatorId, status: { in: ["paid", "rewarded"] } } });
  return meritProgress(paid);
}

export interface PublicAmbassador {
  slug: string;
  name: string;
  photoUrl: string | null;
  niche: string | null;
  siteUrl: string;
}

/**
 * Las embajadoras que eligieron aparecer en la página de Foliocrew: solo nombre, foto, nicho y enlace a su sitio
 * (lo mismo que ya es público). Cuenta activa, con sitio publicado y con la opción prendida.
 */
export async function publicAmbassadors(limit = 12): Promise<PublicAmbassador[]> {
  const rows = await prismaRoot.creator.findMany({
    where: { ambassador: true, ambassadorPublic: true, status: "active", hero: { isNot: null } },
    orderBy: { ambassadorSince: "asc" },
    take: limit,
    select: { slug: true, name: true, customDomain: true, customDomainVerifiedAt: true, hero: { select: { name: true, photoUrl: true, niche: true } } },
  });
  return Promise.all(
    rows.map(async (r) => ({
      slug: r.slug,
      name: r.hero?.name?.trim() || r.name,
      photoUrl: r.hero?.photoUrl ?? null,
      niche: r.hero?.niche ?? null,
      siteUrl: await creatorSiteUrl({ slug: r.slug, customDomain: r.customDomain, customDomainVerifiedAt: r.customDomainVerifiedAt }),
    }))
  );
}
