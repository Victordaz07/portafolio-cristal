import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prismaRoot } from "./prisma-root";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "./auth";
import { RESERVED_SLUGS } from "./tenant-headers";
import { defaultCreatorSlug } from "./tenant";

/** ¿Está abierto el registro? Mientras Foliocrew no abra al público, pide un código de invitación. */
export function signupMode(): "invite" | "closed" {
  return process.env.SIGNUP_INVITE_CODE ? "invite" : "closed";
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

/** "Cristal Flores" → "cristal-flores" (para sugerir el nombre del sitio). */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
}

/** Mensaje de error si el nombre del sitio no sirve, o null si está bien. */
export async function slugProblem(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return "Usa de 3 a 30 letras minúsculas, números o guiones (sin espacios ni tildes)";
  if (RESERVED_SLUGS.has(slug)) return "Ese nombre está reservado; prueba con otro";
  if (await prismaRoot.creator.findUnique({ where: { slug }, select: { id: true } })) return "Ese nombre ya está en uso";
  return null;
}

/** Registro de una creadora nueva: su espacio, su usuario y un sitio inicial listo para editar. */
export async function createCreatorAccount(input: { name: string; slug: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const firstName = input.name.split(" ")[0];
  return prismaRoot.$transaction(async (tx) => {
    const creator = await tx.creator.create({ data: { slug: input.slug, name: input.name } });
    const user = await tx.adminUser.create({
      data: { email: input.email.toLowerCase(), passwordHash, name: input.name, creatorId: creator.id },
    });
    await tx.hero.create({
      data: {
        creatorId: creator.id,
        name: input.name,
        location: "",
        niche: "Creadora de contenido UGC",
        nicheEn: "UGC Content Creator",
        badgeLabel: "UGC Creator",
        headlinePlain: "Contenido que",
        headlinePlainEn: "Content that",
        headlineEmphasis: "conecta",
        headlineEmphasisEn: "connects",
        headlineSuffix: "con tu marca.",
        headlineSuffixEn: "with your brand.",
        description: `Hola, soy ${firstName}. Creo contenido auténtico para marcas.`,
        descriptionEn: `Hi, I'm ${firstName}. I create authentic content for brands.`,
        ctaPrimaryLabel: "Ver portafolio",
        ctaPrimaryLabelEn: "View portfolio",
        ctaPrimaryHref: "#contenido",
        ctaSecondaryLabel: "Colaboremos",
        ctaSecondaryLabelEn: "Let's work together",
        ctaSecondaryHref: "#contacto",
      },
    });
    await tx.siteSettings.create({
      data: {
        creatorId: creator.id,
        whyMeText: "Cuéntale a las marcas por qué trabajar contigo.",
        contactEmail: input.email.toLowerCase(),
        instagramHandle: "",
        tiktokHandle: "",
      },
    });
    return { creator, user };
  });
}

/** Busca a la usuaria por correo y contraseña. La primera vez, migra la cuenta de las variables de entorno. */
export async function authenticate(email: string, password: string) {
  const normalized = email.toLowerCase();
  const user = await prismaRoot.adminUser.findUnique({ where: { email: normalized } });
  if (user) return (await bcrypt.compare(password, user.passwordHash)) ? user : null;

  // Cuenta de antes de Foliocrew (ADMIN_EMAIL / ADMIN_PASSWORD_HASH): pasa a ser la dueña de la creadora por defecto.
  const envEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  if (!envEmail || !envHash || normalized !== envEmail || !(await bcrypt.compare(password, envHash))) return null;
  const creator = await prismaRoot.creator.findUnique({ where: { slug: defaultCreatorSlug() } });
  if (!creator) return null;
  return prismaRoot.adminUser.create({ data: { email: normalized, passwordHash: envHash, creatorId: creator.id } });
}

export async function withSession(response: NextResponse, user: { id: string; email: string; creatorId: string }) {
  const token = await createSessionToken({ userId: user.id, creatorId: user.creatorId, email: user.email });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
