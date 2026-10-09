// Crea UNA agencia real (plan Crew) y te hace su dueño. A diferencia de
// scripts/seed-agency-demo.ts, esto NO es un demo: no borra nada existente y no inventa
// contenido — solo crea la agencia y, si tu cuenta ya existe, le agrega el rol de dueño.
//
// Uso:
//   npx tsx scripts/create-real-agency.ts "Nombre de la agencia" tu@correo.com
//
// Corre esto apuntando a tu base real (tu DATABASE_URL/.env de producción), no a la de
// desarrollo. Si tu cuenta con ese correo todavía no existe, créala primero en
// https://foliocrew.pro/admin/registro y vuelve a correr este script.

import { prismaRoot } from "../lib/prisma-root";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 30);
}

async function main() {
  const name = process.argv[2];
  const ownerEmail = process.argv[3]?.toLowerCase();
  if (!name || !ownerEmail) {
    console.error('Uso: npx tsx scripts/create-real-agency.ts "Nombre de la agencia" tu@correo.com');
    process.exit(1);
  }

  const user = await prismaRoot.adminUser.findUnique({ where: { email: ownerEmail }, select: { id: true, agencyId: true, creatorId: true } });
  if (!user) {
    console.error(`No existe ninguna cuenta de Foliocrew con el correo ${ownerEmail}.`);
    console.error("Créala primero en https://foliocrew.pro/admin/registro (o la dirección de tu sitio) y vuelve a correr este script.");
    process.exit(1);
  }
  if (user.agencyId) {
    console.error(`Esa cuenta ya es parte de una agencia (agencyId=${user.agencyId}). No se tocó nada.`);
    process.exit(1);
  }

  let slug = slugify(name);
  if (await prismaRoot.agency.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const agency = await prismaRoot.agency.create({
    data: {
      name,
      slug,
      maxCreators: 5,
      publicSettings: { create: { tagline: "Gestionamos creadoras UGC", description: "" } },
    },
  });
  await prismaRoot.adminUser.update({ where: { id: user.id }, data: { agencyId: agency.id, agencyRole: "owner" } });

  console.log("\n" + "=".repeat(60));
  console.log("AGENCIA CREADA");
  console.log("=".repeat(60));
  console.log(`
Nombre:   ${agency.name}
Entra en: https://foliocrew.pro/admin/login?agencia=${agency.slug}
          (pestaña "Equipo", con tu correo y tu contraseña de siempre: ${ownerEmail})
Panel:    https://foliocrew.pro/admin/agencia

Desde ahí: Clientes → Nueva creadora (para armar tu cartera) y Dominio (si quieres
un dominio propio para la landing en vez del subdominio de foliocrew.pro).
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prismaRoot.$disconnect());
