import { prismaRoot } from "./prisma-root";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { mailLangFor } from "./email-lang";
import { platformOrigin } from "./site-url";

// Conexiones de la comunidad (etapa 2). Una sola fila por par de cuentas, en cualquier sentido.

/** La conexión entre dos cuentas (la pidiera quien la pidiera), o null. */
export function connectionBetween(a: string, b: string) {
  return prismaRoot.communityConnection.findFirst({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

/** Cuentas con las que tengo una conexión aceptada. */
export async function connectedIds(creatorId: string) {
  const rows = await prismaRoot.communityConnection.findMany({
    where: { status: "accepted", OR: [{ requesterId: creatorId }, { addresseeId: creatorId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((r) => (r.requesterId === creatorId ? r.addresseeId : r.requesterId));
}

/** Solicitudes que me llegaron y todavía no respondí (para el contador del menú). */
export function pendingIncomingCount(creatorId: string) {
  return prismaRoot.communityConnection.count({ where: { addresseeId: creatorId, status: "pending" } });
}

/** Al bloquear: se borra la conexión (o la solicitud) entre las dos cuentas. */
export function removeConnectionBetween(a: string, b: string) {
  return prismaRoot.communityConnection.deleteMany({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

/**
 * Correo a la otra persona: le pidieron conectar o aceptaron su solicitud.
 * Respeta su preferencia de avisos (emailNotify). Si falla, solo se registra el error.
 */
export async function notifyConnection(kind: "request" | "accepted", p: { toCreatorId: string; fromName: string; fromHandle: string; note?: string }) {
  try {
    const [profile, owner] = await Promise.all([
      prismaRoot.communityProfile.findUnique({ where: { creatorId: p.toCreatorId }, select: { emailNotify: true } }),
      prismaRoot.adminUser.findFirst({ where: { creatorId: p.toCreatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } }),
    ]);
    if (!profile?.emailNotify || !owner) return;
    const origin = await platformOrigin();
    const lang = await mailLangFor(owner.email);
    const en = lang === "en";
    const request = kind === "request";
    const mail = noticeEmail({
      lang,
      origin,
      name: owner.name,
      subject: request
        ? en ? `${p.fromName} wants to connect with you` : `${p.fromName} quiere conectar contigo`
        : en ? `${p.fromName} accepted your request` : `${p.fromName} aceptó tu solicitud`,
      title: request ? (en ? "New connection request" : "Nueva solicitud de conexión") : en ? "You're connected!" : "¡Ya están conectados!",
      lines: [
        request
          ? en
            ? `${p.fromName} (@${p.fromHandle}) wants to connect with you in the Foliocrew community.`
            : `${p.fromName} (@${p.fromHandle}) quiere conectar contigo en la comunidad de Foliocrew.`
          : en
            ? `${p.fromName} (@${p.fromHandle}) accepted your connection request. Now you can send each other messages.`
            : `${p.fromName} (@${p.fromHandle}) aceptó tu solicitud de conexión. Ya pueden escribirse mensajes.`,
      ],
      quote: p.note?.trim() ? p.note.slice(0, 300) : undefined,
      button: request
        ? { label: en ? "See the request" : "Ver la solicitud", url: `${origin}/admin/comunidad/conexiones` }
        : { label: en ? "View their profile" : "Ver su perfil", url: `${origin}/admin/comunidad/creador/${p.fromHandle}` },
      note: en ? "You can turn off these emails in Community → My profile." : "Puedes desactivar estos correos en Comunidad → Mi perfil.",
    });
    await sendEmail({ to: owner.email, ...mail });
  } catch (error) {
    console.error("No se pudo avisar de la conexión", error);
  }
}
