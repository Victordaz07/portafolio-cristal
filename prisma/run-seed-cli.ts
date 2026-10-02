import "dotenv/config";
import type { PrismaClient } from "@prisma/client";
import { prisma, prismaRoot } from "../lib/prisma";
import { runAsCreator } from "../lib/tenant";
import { seedDatabase } from "./seed";

// El contenido de ejemplo es de Cristal, la creadora #1 (slug "cristal").
async function main() {
  const creator = await prismaRoot.creator.upsert({
    where: { slug: "cristal" },
    create: { id: "creator_cristal", slug: "cristal", name: "Cristal Amalia Flores Bello" },
    update: {},
  });
  // `prisma` (con filtro por creadora) borra y crea solo filas de Cristal.
  await runAsCreator(creator.id, () => seedDatabase(prisma as unknown as PrismaClient));
}

main()
  .then(() => console.log("Seed completado."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaRoot.$disconnect();
  });
