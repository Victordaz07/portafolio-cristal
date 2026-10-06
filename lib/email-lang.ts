import { prismaRoot } from "./prisma-root";
import type { MailLang } from "./email-templates";

// Idioma de los correos: el del panel de quien los recibe (AdminUser.language). Español si no se sabe.

export const asMailLang = (value: string | null | undefined): MailLang => (value === "en" ? "en" : "es");

/** Idioma del panel de una persona por su correo (equipo, dueños, autores de tickets). */
export async function mailLangFor(email: string | null | undefined): Promise<MailLang> {
  if (!email) return "es";
  const user = await prismaRoot.adminUser.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { language: true },
  });
  return asMailLang(user?.language);
}

/** Fecha larga para correos: "5 de octubre de 2026" / "October 5, 2026". */
export const mailDate = (d: Date, lang: MailLang) =>
  d.toLocaleDateString(lang === "en" ? "en-US" : "es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
