// Demo completa del plan Crew: una agencia con su equipo, tres creadoras en su cartera (con
// contenido, una marca, un contrato, una factura y publicaciones programadas) y dos pagos de
// ejemplo. Pensado para explorar el panel con datos reales, no para producción.
//
// Uso:  npx tsx scripts/seed-agency-demo.ts   (o  npm run db:seed:agency-demo)
// Se puede correr varias veces: borra su propia demo anterior antes de crear una nueva.

import bcrypt from "bcryptjs";
import { prismaRoot } from "../lib/prisma-root";
import { createCreatorAccount, rotateAccessCode } from "../lib/creators";
import { runAsCreator } from "../lib/tenant";
import { createContract } from "../lib/contracts-server";
import { createInvoice } from "../lib/invoices-server";
import { emptyTerms } from "../lib/contracts";

const AGENCY_SLUG = "vibe-creators";
const DAY = 86_400_000;
const inDays = (n: number) => new Date(Date.now() + n * DAY);

async function makeCreator(opts: { name: string; slug: string; email: string; niche: string; agencyId: string; showcase: boolean }) {
  const { creator, user } = await createCreatorAccount({ name: opts.name, slug: opts.slug, email: opts.email, password: "sin-uso-" + Math.random().toString(36).slice(2) });
  await prismaRoot.creator.update({ where: { id: creator.id }, data: { agencyId: opts.agencyId, plan: "crew", onboardedAt: new Date() } });
  await prismaRoot.hero.update({
    where: { creatorId: creator.id },
    data: { niche: opts.niche, nicheEn: opts.niche, description: `Creo contenido de ${opts.niche.toLowerCase()} para marcas que buscan autenticidad.` },
  });
  const code = await rotateAccessCode(user.id);
  return { creator, user, code };
}

async function main() {
  console.log("Borrando demo anterior (si existe)…");
  const DEMO_SLUGS = [`${AGENCY_SLUG}-owner`, `${AGENCY_SLUG}-cm`, "valery-moda", "daniela-fitness", "marco-gamer"];
  const prevAgency = await prismaRoot.agency.findUnique({ where: { slug: AGENCY_SLUG } });
  if (prevAgency) {
    await prismaRoot.creator.deleteMany({ where: { OR: [{ agencyId: prevAgency.id }, { slug: { in: DEMO_SLUGS } }] } });
    await prismaRoot.agency.delete({ where: { id: prevAgency.id } });
  } else {
    // Restos de una corrida interrumpida (la agencia no llegó a crearse, pero algunas creadoras sí).
    await prismaRoot.creator.deleteMany({ where: { slug: { in: DEMO_SLUGS } } });
  }

  console.log("Creando agencia…");
  const agency = await prismaRoot.agency.create({
    data: {
      name: "Vibe Creators Co.",
      slug: AGENCY_SLUG,
      maxCreators: 5,
      trialEndsAt: inDays(14),
      publicSettings: {
        create: {
          tagline: "Gestionamos creadoras UGC para que tú solo pienses en tu marca",
          description:
            "Somos una agencia boutique que administra calendario, marcas y contratos de un grupo seleccionado de creadoras dominicanas, en moda, fitness y gaming.",
          contactEmail: "hola@vibecreators.test",
          services: [
            { title: "Calendario y aprobación", description: "Planificamos y coordinamos cada publicación con la creadora." },
            { title: "Gestión de marcas", description: "Negociamos tratos, contratos y cobramos por ella." },
            { title: "Reportes de campaña", description: "Reportes listos para enviar a la marca al cerrar cada colaboración." },
          ],
        },
      },
    },
  });

  console.log("Creando equipo de la agencia (dueña + community manager)…");
  const ownerCreatorShell = await prismaRoot.creator.create({ data: { slug: `${AGENCY_SLUG}-owner`, name: "Valentina (dueña)", plan: "crew" } });
  await prismaRoot.adminUser.create({
    data: {
      email: "valentina@vibecreators.test",
      passwordHash: await bcrypt.hash("demo12345", 10),
      creatorId: ownerCreatorShell.id,
      agencyId: agency.id,
      agencyRole: "owner",
      role: "owner",
      name: "Valentina",
    },
  });
  const cmCreatorShell = await prismaRoot.creator.create({ data: { slug: `${AGENCY_SLUG}-cm`, name: "Jonathan (CM)", plan: "crew" } });
  await prismaRoot.adminUser.create({
    data: {
      email: "jonathan@vibecreators.test",
      passwordHash: await bcrypt.hash("demo12345", 10),
      creatorId: cmCreatorShell.id,
      agencyId: agency.id,
      agencyRole: "cm",
      role: "owner",
      name: "Jonathan",
    },
  });

  console.log("Creando tres creadoras en la cartera…");
  const valery = await makeCreator({ name: "Valery Moda", slug: "valery-moda", email: "valery@vibecreators.test", niche: "Moda", agencyId: agency.id, showcase: true });
  const dani = await makeCreator({ name: "Daniela Fitness", slug: "daniela-fitness", email: "daniela@vibecreators.test", niche: "Fitness", agencyId: agency.id, showcase: true });
  const marco = await makeCreator({ name: "Marco Gamer", slug: "marco-gamer", email: "marco@vibecreators.test", niche: "Gaming", agencyId: agency.id, showcase: false });

  await prismaRoot.agencyPublicSettings.update({
    where: { agencyId: agency.id },
    data: { showcaseCreatorIds: [valery.creator.id, dani.creator.id] },
  });

  console.log("Agregando contenido, marca, contrato, factura y calendario a Valery…");
  await prismaRoot.contentCard.createMany({
    data: [
      { creatorId: valery.creator.id, type: "video", platform: "tiktok", caption: "Get ready with me para una boda", category: "Moda", statPrimary: "84K vistas", order: 0 },
      { creatorId: valery.creator.id, type: "photo", platform: "instagram", caption: "Look de oficina con piezas de temporada", category: "Moda", statPrimary: "6.2K likes", order: 1 },
    ],
  });
  const brand = await prismaRoot.brand.create({
    data: {
      creatorId: valery.creator.id,
      name: "Boutique Luna",
      dealStatus: "active",
      contactName: "Equipo de Marketing Luna",
      contactEmail: "marketing@boutiqueluna.test",
      dealValue: 450,
      packageDetail: "3 reels + 2 fotos, derechos de uso 60 días",
      platforms: ["instagram", "tiktok"],
      paymentStatus: "pending",
    },
  });
  await runAsCreator(valery.creator.id, async () => {
    const contract = await createContract({
      brandId: brand.id,
      language: "es",
      terms: { ...emptyTerms("sponsored"), fee: 450, deliverables: ["3 reels", "2 fotos"], deliveryDate: inDays(10).toISOString().slice(0, 10) },
      parties: { creator: { name: "Valery Moda", email: "valery@vibecreators.test" }, brand: { name: "Boutique Luna", company: "Boutique Luna SRL", email: "marketing@boutiqueluna.test" } },
    });
    await prismaRoot.contract.update({ where: { id: contract.id }, data: { status: "sent", sentAt: new Date() } });

    await createInvoice({
      brandId: brand.id,
      items: [{ description: "Paquete de contenido — Boutique Luna", quantity: 1, unitAmount: 45000 }],
      billTo: { name: "Boutique Luna", company: "Boutique Luna SRL", email: "marketing@boutiqueluna.test" },
      dueAt: inDays(15).toISOString().slice(0, 10),
      language: "es",
    });
  });
  await prismaRoot.scheduledPost.create({
    data: { creatorId: valery.creator.id, caption: "Outfit de la semana ✨", contentType: "reel", networks: ["instagram", "tiktok"], scheduledFor: inDays(2), status: "scheduled", brandId: brand.id },
  });

  console.log("Agregando contenido y calendario a Daniela…");
  await prismaRoot.contentCard.createMany({
    data: [{ creatorId: dani.creator.id, type: "video", platform: "instagram", caption: "Rutina de piernas en 15 minutos", category: "Fitness", statPrimary: "31K vistas", order: 0 }],
  });
  await prismaRoot.brand.create({
    data: { creatorId: dani.creator.id, name: "ProteínaRD", dealStatus: "prospect", contactEmail: "hola@proteinard.test", packageDetail: "Propuesta enviada, sin responder" },
  });
  await prismaRoot.scheduledPost.create({
    data: { creatorId: dani.creator.id, caption: "Reto de 7 días: abdomen", contentType: "post", networks: ["instagram"], scheduledFor: inDays(3), status: "scheduled" },
  });

  console.log("Agregando calendario a Marco…");
  await prismaRoot.scheduledPost.create({
    data: { creatorId: marco.creator.id, caption: "Live de lanzamiento del juego nuevo", contentType: "story", networks: ["tiktok"], scheduledFor: inDays(1), status: "scheduled" },
  });

  console.log("Agregando pagos de ejemplo de la agencia…");
  await prismaRoot.agencyPayment.create({
    data: { agencyId: agency.id, months: 1, amountCents: 14900, method: "transfer", reference: "DEMO-PAGADO", status: "confirmed", confirmedAt: new Date(), periodEnd: inDays(16) },
  });
  await prismaRoot.agencyPayment.create({
    data: { agencyId: agency.id, months: 1, amountCents: 14900, method: "paypal", reference: "DEMO-PENDIENTE", status: "reported" },
  });

  console.log("\n" + "=".repeat(64));
  console.log("DEMO LISTA — plan Crew");
  console.log("=".repeat(64));
  console.log(`
Landing de la agencia:     http://${AGENCY_SLUG}.localhost:3000/  (o con PLATFORM_ROOT_DOMAIN real)
Login de la agencia:       http://localhost:3000/admin/login?agencia=${AGENCY_SLUG}

Equipo (pestaña "Equipo", correo + contraseña):
  Dueña:             valentina@vibecreators.test / demo12345
  Community manager: jonathan@vibecreators.test / demo12345

Creadoras de la cartera (pestaña "Soy cliente", correo + código):
  ${valery.user.email}  →  ${valery.code}   (con marca, contrato, factura y calendario)
  ${dani.user.email}  →  ${dani.code}   (con marca y calendario)
  ${marco.user.email}  →  ${marco.code}   (solo calendario, no aparece en la vitrina pública)

Pagos de ejemplo ya cargados en /admin/agencia/facturacion (uno confirmado, uno por confirmar
visible en /admin/plataforma para quien administra Foliocrew).
`);
  console.log("Para borrar esta demo, vuelve a correr este mismo script.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prismaRoot.$disconnect());
