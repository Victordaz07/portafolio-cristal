import { prisma } from "@/lib/prisma";
import { prismaRoot } from "@/lib/prisma-root";
import { runAsCreator } from "@/lib/tenant";
import { getFreshTokens } from "@/lib/social/accounts";
import { publishToInstagram } from "@/lib/social/instagram-publish";
import { publishToFacebook } from "@/lib/social/facebook-publish";
import { noticeEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { platformOrigin } from "@/lib/site-url";
import { AUTO_NETWORKS, MAX_ATTEMPTS, PUBLISH_SCOPE, isDue, overallStatus, parseResults, planPublish, publishEnabled, type AutoNetwork, type NetResult, type PublishResults } from "@/lib/publish";

export type PublishOutcome = { ok: true; overall: ReturnType<typeof overallStatus>; results: PublishResults } | { ok: false; error: "not_found" | "busy" | "disabled" };

/**
 * Publica una pieza ya programada en sus redes (la creadora actual). Cada red es independiente: si una falla,
 * las que ya salieron no se repiten. Un video que aún se procesa queda «pending» y se retoma en el siguiente intento.
 */
export async function publishPost(postId: string): Promise<PublishOutcome> {
  const post = await prisma.scheduledPost.findUnique({ where: { id: postId } });
  if (!post || post.status === "published") return { ok: false, error: "not_found" };
  const networks = post.networks.filter((n): n is AutoNetwork => (AUTO_NETWORKS as readonly string[]).includes(n));
  if (!networks.length || !networks.every(publishEnabled)) return { ok: false, error: "disabled" };

  // Bloqueo: solo un proceso a la vez intenta publicar esta pieza.
  const claimed = await prisma.scheduledPost.updateMany({
    where: { id: postId, OR: [{ publishAttemptedAt: null }, { publishAttemptedAt: { lt: new Date(Date.now() - 2 * 60_000) } }] },
    data: { publishAttemptedAt: new Date(), publishAttempts: { increment: 1 } },
  });
  if (!claimed.count) return { ok: false, error: "busy" };

  const results = parseResults(post.publishResults);
  for (const network of networks) {
    if (results[network]?.status === "ok") continue;
    results[network] = await publishOne(network, post, results[network]);
  }
  const overall = overallStatus(post.networks, results);
  const attempts = post.publishAttempts + 1;
  const giveUp = overall !== "published" && overall !== "pending" && attempts >= MAX_ATTEMPTS;
  await prisma.scheduledPost.update({
    where: { id: postId },
    data: {
      publishResults: results as object,
      ...(overall === "published" ? { status: "published", publishedAt: new Date() } : {}),
      // Tras el último intento fallido se apaga la publicación automática para que la persona lo revise.
      ...(giveUp ? { autoPublish: false } : {}),
    },
  });
  if (giveUp) await notifyFailure(post.caption, results).catch((error) => console.error("Publicación automática: no se pudo avisar del fallo", error));
  return { ok: true, overall, results };
}

async function publishOne(network: AutoNetwork, post: { networks: string[]; contentType: string; mediaType: string | null; mediaUrl: string | null; caption: string; brandId: string | null }, previous: NetResult | undefined): Promise<NetResult> {
  const at = new Date().toISOString();
  const plan = planPublish(post, network);
  if (!plan.ok) return { status: "error", error: `No se puede publicar: ${plan.reason}`, at };
  try {
    const account = await prisma.socialAccount.findFirst({ where: { platform: network } });
    if (!account) return { status: "error", error: "La cuenta ya no está conectada", at };
    if (!account.scopes.includes(PUBLISH_SCOPE[network])) return { status: "error", error: "Falta el permiso para publicar: vuelve a conectar la cuenta", at };
    const { tokens } = await getFreshTokens(account);
    if (network === "instagram") {
      return await publishToInstagram({ igId: account.externalId, token: tokens.accessToken, kind: plan.kind, mediaUrl: post.mediaUrl as string, caption: post.caption, creationId: previous?.status === "pending" ? previous.creationId : undefined });
    }
    return await publishToFacebook({ userToken: tokens.accessToken, kind: plan.kind, mediaUrl: post.mediaUrl, caption: post.caption });
  } catch (error) {
    return { status: "error", error: (error instanceof Error ? error.message : "Error desconocido").slice(0, 300), at };
  }
}

async function notifyFailure(caption: string, results: PublishResults) {
  const owner = await prisma.adminUser.findFirst({ where: { role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true, language: true } });
  if (!owner) return;
  const en = owner.language === "en";
  const origin = await platformOrigin();
  const detail = AUTO_NETWORKS.map((n) => (results[n]?.status === "error" ? `${n}: ${results[n]?.error}` : null)).filter(Boolean).join(" · ");
  const first = caption.split("\n")[0].slice(0, 80) || (en ? "(no text)" : "(sin texto)");
  const mail = noticeEmail({
    lang: en ? "en" : "es",
    origin,
    name: owner.name,
    subject: en ? "We couldn't publish your post" : "No pudimos publicar tu publicación",
    title: en ? "We couldn't publish your post" : "No pudimos publicar tu publicación",
    lines: en
      ? [`“${first}” didn't go out after ${MAX_ATTEMPTS} tries. Automatic publishing was turned off for this post.`, detail, "Open the calendar to fix it or publish it by hand."]
      : [`«${first}» no salió después de ${MAX_ATTEMPTS} intentos. Apagamos la publicación automática de esta pieza.`, detail, "Abre el calendario para corregirla o publícala a mano."],
    button: { label: en ? "Open the calendar" : "Abrir el calendario", url: `${origin}/admin/calendario` },
  });
  await sendEmail({ to: owner.email, ...mail });
}

/** Publica todo lo programado que ya llegó a su hora, de todas las cuentas. Lo llama la tarea programada. */
export async function publishDuePosts(limit = 25) {
  const candidates = await prismaRoot.scheduledPost.findMany({
    where: { status: "scheduled", autoPublish: true, scheduledFor: { lte: new Date() }, publishAttempts: { lt: MAX_ATTEMPTS } },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    select: { id: true, creatorId: true, status: true, autoPublish: true, scheduledFor: true, publishAttempts: true, publishAttemptedAt: true, creator: { select: { status: true } } },
  });
  let published = 0;
  let failed = 0;
  let skipped = 0;
  for (const c of candidates) {
    if (c.creator.status === "paused" || !isDue(c)) {
      skipped += 1;
      continue;
    }
    const outcome = await runAsCreator(c.creatorId, () => publishPost(c.id)).catch((error) => {
      console.error("Publicación automática: error inesperado", error instanceof Error ? error.message : error);
      return null;
    });
    if (outcome?.ok && outcome.overall === "published") published += 1;
    else if (outcome?.ok && outcome.overall !== "pending") failed += 1;
    else skipped += 1;
  }
  return { checked: candidates.length, published, failed, skipped };
}
