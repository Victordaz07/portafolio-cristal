import { randomBytes } from "node:crypto";
import { prismaRoot } from "./prisma-root";
import { logPlatformAction } from "./platform-admin";
import { codeFromBytes } from "./ambassadors";

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
