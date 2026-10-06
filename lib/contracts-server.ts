import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { prismaRoot } from "./prisma-root";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { mailLangFor } from "./email-lang";
import { platformOrigin } from "./site-url";
import { CONTRACT_DISCLAIMER, contractToText, generateContract, type ContractParties, type ContractTerms } from "./contracts";

// Contratos (B4): lo que necesita el servidor. Dentro del panel se usa `prisma` (solo la cuenta de la
// sesión); la página pública usa `prismaRoot` y busca por el token.

export type ContractInput = { brandId?: string | null; language: "es" | "en"; terms: ContractTerms; parties: ContractParties };

/** Texto y título que salen de los huecos (siempre se generan en el servidor, nunca vienen del navegador). */
export function buildContract(input: Pick<ContractInput, "language" | "terms" | "parties">) {
  const generated = generateContract(input.terms, input.parties, input.language);
  return { title: generated.title, bodyText: contractToText(generated) };
}

export function createContract(input: ContractInput) {
  const { title, bodyText } = buildContract(input);
  return prisma.contract.create({
    data: {
      brandId: input.brandId || null,
      publicToken: randomBytes(32).toString("base64url"),
      template: input.terms.template,
      language: input.language,
      title,
      terms: input.terms,
      parties: input.parties,
      bodyText,
    },
  });
}

export const contractLink = (origin: string, token: string) => `${origin}/c/${token}`;
export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** El texto del contrato sin marcas "#", para pegarlo en un correo. */
export const plainContract = (bodyText: string) => bodyText.replace(/^#{1,2}\s*/gm, "").replace(/^- /gm, "• ");

type PartiesJson = { creator?: { name?: string; email?: string }; brand?: { name?: string; company?: string; email?: string } };
const partiesOf = (value: unknown): PartiesJson => (value && typeof value === "object" ? (value as PartiesJson) : {});

type ContractRow = { id: string; creatorId: string; title: string; language: string; publicToken: string; parties: unknown; bodyText: string };

/** Correo a la marca con el enlace para leer y aceptar el contrato. */
export async function emailContractToBrand(contract: ContractRow) {
  const parties = partiesOf(contract.parties);
  const to = parties.brand?.email;
  if (!to) return { sent: false as const, reason: "no_email" };
  const origin = await platformOrigin();
  const en = contract.language === "en";
  const from = parties.creator?.name || "Foliocrew";
  const mail = noticeEmail({
    lang: en ? "en" : "es",
    origin,
    name: parties.brand?.name || null,
    subject: en ? `${from} sent you an agreement to review` : `${from} te envió un acuerdo para revisar`,
    title: contract.title,
    lines: [
      en
        ? `${from} sent you an agreement: “${contract.title}”. Please read it and, if you agree, accept it online.`
        : `${from} te envió un acuerdo: «${contract.title}». Léelo y, si estás de acuerdo, acéptalo en línea.`,
    ],
    button: { label: en ? "Read and accept" : "Leer y aceptar", url: contractLink(origin, contract.publicToken) },
    note: CONTRACT_DISCLAIMER[en ? "en" : "es"],
  });
  return sendEmail({ to, ...mail });
}

/** Aviso al creador: la marca abrió, aceptó o pidió cambios. */
export async function notifyCreatorAboutContract(kind: "viewed" | "accepted" | "declined", contract: ContractRow, extra?: { reason?: string }) {
  try {
    const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId: contract.creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } });
    if (!owner) return;
    const origin = await platformOrigin();
    const lang = await mailLangFor(owner.email);
    const en = lang === "en";
    const parties = partiesOf(contract.parties);
    const brand = parties.brand?.company || parties.brand?.name || (en ? "The brand" : "La marca");
    const text = {
      viewed: en ? [`${brand} opened the agreement`, `${brand} just opened “${contract.title}”.`] : [`${brand} abrió el acuerdo`, `${brand} acaba de abrir «${contract.title}».`],
      accepted: en
        ? [`${brand} accepted the agreement 🎉`, `${brand} accepted “${contract.title}”. The deal is now active and you have a record with the date, time and IP address.`]
        : [`${brand} aceptó el acuerdo 🎉`, `${brand} aceptó «${contract.title}». El trato ya está activo y tienes la constancia con fecha, hora y dirección IP.`],
      declined: en
        ? [`${brand} asked for changes`, `${brand} asked for changes to “${contract.title}”. Edit it and send it again.`]
        : [`${brand} pidió cambios`, `${brand} pidió cambios en «${contract.title}». Edítalo y envíalo de nuevo.`],
    }[kind];
    const mail = noticeEmail({
      lang,
      origin,
      name: owner.name,
      subject: text[0],
      title: text[0],
      lines: [text[1]],
      quote: extra?.reason || undefined,
      button: { label: en ? "Open the agreement" : "Abrir el acuerdo", url: `${origin}/admin/contratos/${contract.id}` },
    });
    await sendEmail({ to: owner.email, ...mail });
  } catch (error) {
    console.error("No se pudo avisar del contrato", error);
  }
}

/** Copia del contrato aceptado para quien lo aceptó y para el creador (con el texto completo). */
export async function emailAcceptedCopies(contract: ContractRow, accepted: { name: string; email: string; at: Date; ip: string }) {
  try {
    const origin = await platformOrigin();
    const en = contract.language === "en";
    const when = accepted.at.toLocaleString(en ? "en-US" : "es-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }) + " UTC";
    const quote = plainContract(contract.bodyText);
    const url = contractLink(origin, contract.publicToken);
    const recipients: { to: string; name: string | null; lang: "es" | "en" }[] = [{ to: accepted.email, name: accepted.name, lang: en ? "en" : "es" }];
    const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId: contract.creatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } });
    if (owner) recipients.push({ to: owner.email, name: owner.name, lang: await mailLangFor(owner.email) });
    const seen = new Set<string>();
    for (const r of recipients) {
      if (seen.has(r.to.toLowerCase())) continue;
      seen.add(r.to.toLowerCase());
      const e = r.lang === "en";
      const mail = noticeEmail({
        lang: r.lang,
        origin,
        name: r.name,
        subject: e ? `Copy of the accepted agreement: ${contract.title}` : `Copia del acuerdo aceptado: ${contract.title}`,
        title: e ? "Agreement accepted" : "Acuerdo aceptado",
        lines: [
          e
            ? `${accepted.name} accepted this agreement on ${when} (IP ${accepted.ip}). Here is a copy.`
            : `${accepted.name} aceptó este acuerdo el ${when} (IP ${accepted.ip}). Aquí tienes una copia.`,
        ],
        quote,
        button: { label: e ? "View it online" : "Verlo en línea", url },
        note: CONTRACT_DISCLAIMER[e ? "en" : "es"],
      });
      await sendEmail({ to: r.to, ...mail });
    }
  } catch (error) {
    console.error("No se pudo enviar la copia del contrato", error);
  }
}
