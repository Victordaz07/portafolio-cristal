import { prismaRoot } from "./prisma-root";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { mailLangFor } from "./email-lang";
import { platformOrigin } from "./site-url";
import { teamEmailsWith } from "./team";
import { LIMITS, reportReasonLabel } from "./community";

// Moderación de la comunidad: qué se reporta, cuándo avisar al equipo, ocultar solo y avisar a la persona.
// Los correos nunca rompen la acción: si fallan, solo se registra el error.

export type TargetType = "post" | "reply" | "profile";

export interface ReportTarget {
  type: TargetType;
  id: string;
  /** Cuenta dueña del contenido. */
  creatorId: string;
  /** Texto corto para mostrar (título, inicio de la respuesta o nombre). */
  summary: string;
  /** Publicación donde está (para enlazar). */
  postId: string | null;
  hidden: boolean;
}

/** Busca lo reportado y quién es su autor (null si no existe o ya se borró). */
export async function findTarget(type: TargetType, id: string): Promise<ReportTarget | null> {
  if (type === "post") {
    const p = await prismaRoot.communityPost.findUnique({ where: { id }, select: { creatorId: true, title: true, hiddenAt: true, deletedAt: true } });
    return p && !p.deletedAt ? { type, id, creatorId: p.creatorId, summary: p.title, postId: id, hidden: Boolean(p.hiddenAt) } : null;
  }
  if (type === "reply") {
    const r = await prismaRoot.communityReply.findUnique({ where: { id }, select: { creatorId: true, body: true, postId: true, hiddenAt: true, deletedAt: true } });
    return r && !r.deletedAt ? { type, id, creatorId: r.creatorId, summary: r.body.slice(0, 140), postId: r.postId, hidden: Boolean(r.hiddenAt) } : null;
  }
  const pr = await prismaRoot.communityProfile.findUnique({ where: { id }, select: { creatorId: true, displayName: true } });
  return pr ? { type, id, creatorId: pr.creatorId, summary: pr.displayName, postId: null, hidden: false } : null;
}

/** Oculta (o vuelve a mostrar) una publicación o respuesta. Ajusta el contador de respuestas. */
export async function setHidden(target: ReportTarget, hidden: boolean, by: string) {
  if (target.type === "post") {
    await prismaRoot.communityPost.update({ where: { id: target.id }, data: hidden ? { hiddenAt: new Date(), hiddenBy: by, pinned: false } : { hiddenAt: null, hiddenBy: null } });
  } else if (target.type === "reply") {
    if (hidden === target.hidden) return;
    await prismaRoot.$transaction([
      prismaRoot.communityReply.update({ where: { id: target.id }, data: hidden ? { hiddenAt: new Date(), hiddenBy: by } : { hiddenAt: null, hiddenBy: null } }),
      prismaRoot.communityPost.update({ where: { id: target.postId! }, data: { replyCount: { increment: hidden ? -1 : 1 } } }),
    ]);
  }
}

/**
 * Después de un reporte nuevo: con 3 reportes abiertos (o si es una posible estafa) avisa al equipo;
 * con 5, oculta el contenido solo hasta que el equipo lo revise.
 */
export async function afterReport(target: ReportTarget, reason: string) {
  const open = await prismaRoot.communityReport.count({ where: { targetType: target.type, targetId: target.id, status: "open" } });
  if (open >= LIMITS.reportsToAutoHide && !target.hidden && target.type !== "profile") {
    await setHidden(target, true, "auto");
  }
  if (open === LIMITS.reportsToNotify || reason === "estafa") {
    try {
      const origin = await platformOrigin();
      const recipients = await teamEmailsWith("community");
      await Promise.all(
        recipients.map(async (to) => {
          const lang = await mailLangFor(to);
          const en = lang === "en";
          const mail = noticeEmail({
            lang,
            origin,
            subject: en ? `Community report: ${reportReasonLabel(reason, "en")}` : `Reporte en la comunidad: ${reportReasonLabel(reason)}`,
            title: en ? "Content to review" : "Contenido para revisar",
            lines: [
              en
                ? `It has ${open} open report(s). Latest reason: ${reportReasonLabel(reason, "en")}.`
                : `Tiene ${open} reporte(s) abierto(s). Último motivo: ${reportReasonLabel(reason)}.`,
            ],
            quote: target.summary,
            button: { label: en ? "Open the Community department" : "Abrir el departamento de Comunidad", url: `${origin}/admin/equipo/comunidad` },
          });
          return sendEmail({ to, ...mail });
        })
      );
    } catch (error) {
      console.error("No se pudo avisar al equipo del reporte", error);
    }
  }
}

/** Correo a la persona cuando el equipo oculta su contenido o pausa su participación. */
export async function notifyAuthor(creatorId: string, kind: "hidden" | "muted", detail: { summary: string; days?: number }) {
  try {
    const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } });
    if (!owner) return;
    const origin = await platformOrigin();
    const lang = await mailLangFor(owner.email);
    const en = lang === "en";
    const mail = noticeEmail({
      lang,
      origin,
      name: owner.name,
      subject:
        kind === "hidden"
          ? en ? "We hid a post of yours in the community" : "Ocultamos una publicación tuya en la comunidad"
          : en ? "Your community participation is paused" : "Tu participación en la comunidad está en pausa",
      title: kind === "hidden" ? (en ? "Content hidden" : "Contenido oculto") : en ? "Participation paused" : "Participación en pausa",
      lines: [
        kind === "hidden"
          ? en
            ? "The Community team reviewed some reports and hid this content because it goes against the community rules."
            : "El equipo de Comunidad revisó unos reportes y ocultó este contenido porque va en contra de las reglas de la comunidad."
          : en
            ? `The Community team paused your posts and replies for ${detail.days} day(s) after reviewing some reports. You can still read.`
            : `El equipo de Comunidad pausó tus publicaciones y respuestas por ${detail.days} día(s) después de revisar unos reportes. Puedes seguir leyendo.`,
      ],
      quote: detail.summary,
      button: { label: en ? "Read the community rules" : "Leer las reglas de la comunidad", url: `${origin}/admin/comunidad/perfil` },
      note: en ? "If you think it was a mistake, write to us from Support in your dashboard." : "Si crees que fue un error, escríbenos desde Soporte en tu panel.",
    });
    await sendEmail({ to: owner.email, ...mail });
  } catch (error) {
    console.error("No se pudo avisar a la persona de la moderación", error);
  }
}
