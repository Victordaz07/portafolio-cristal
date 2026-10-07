import webpush from "web-push";
import { prismaRoot } from "@/lib/prisma-root";
import { tooManyAttempts } from "@/lib/rate-limit";
import { DEDUPE_MS, buildPayload, isAllowedEndpoint, isGoneStatus, type PushPayload, type PushTopic } from "@/lib/push";

// Los avisos en el celular solo funcionan cuando el dueño pone las llaves VAPID en Vercel
// (VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY, de `npx web-push generate-vapid-keys`). Sin ellas todo queda apagado.
export const pushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let ready = false;
function init() {
  if (ready) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:soporte@foliocrew.pro", process.env.VAPID_PUBLIC_KEY as string, process.env.VAPID_PRIVATE_KEY as string);
  ready = true;
}

/**
 * Manda un aviso a los dispositivos de la cuenta que pidieron ese tema. Nunca lanza (un aviso no debe romper
 * lo que lo provocó). `build` recibe el idioma de la persona dueña del dispositivo. `key` evita repetir el
 * mismo aviso (por ejemplo, la misma factura) durante un minuto.
 */
export async function sendPush(creatorId: string, topic: PushTopic | null, build: (lang: "es" | "en") => PushPayload, opts: { key?: string; onlyUserId?: string } = {}) {
  const result = { sent: 0, removed: 0 };
  if (!pushConfigured()) return result;
  try {
    if (opts.key && tooManyAttempts(`push:${creatorId}:${topic ?? "any"}:${opts.key}`, 1, DEDUPE_MS)) return result;
    // topic null = aviso de prueba: va a todos los dispositivos de esa persona, sin mirar los temas.
    const subs = await prismaRoot.pushSubscription.findMany({ where: { creatorId, ...(topic ? { topics: { has: topic } } : {}), ...(opts.onlyUserId ? { userId: opts.onlyUserId } : {}) }, take: 25 });
    if (!subs.length) return result;
    init();
    const users = await prismaRoot.adminUser.findMany({ where: { id: { in: Array.from(new Set(subs.map((s) => s.userId))) } }, select: { id: true, language: true } });
    const langOf = new Map(users.map((u) => [u.id, u.language === "en" ? ("en" as const) : ("es" as const)]));
    await Promise.all(
      subs.map(async (sub) => {
        if (!isAllowedEndpoint(sub.endpoint)) {
          await prismaRoot.pushSubscription.deleteMany({ where: { id: sub.id } });
          result.removed += 1;
          return;
        }
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, buildPayload(build(langOf.get(sub.userId) ?? "es")), { TTL: 86_400, timeout: 8000 });
          await prismaRoot.pushSubscription.update({ where: { id: sub.id }, data: { lastSentAt: new Date() } });
          result.sent += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (isGoneStatus(status)) {
            await prismaRoot.pushSubscription.deleteMany({ where: { id: sub.id } });
            result.removed += 1;
          } else {
            console.error("Aviso en el celular: no se pudo enviar", status ?? (error instanceof Error ? error.message : error));
          }
        }
      })
    );
  } catch (error) {
    console.error("Aviso en el celular: error inesperado", error instanceof Error ? error.message : error);
  }
  return result;
}
