import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(() => console.log("Seed completado."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
