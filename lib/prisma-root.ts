import { PrismaClient } from "@prisma/client";

// Cliente SIN filtro por creadora. Úsalo solo para lo que no pertenece a una
// creadora (inicio de sesión, registro, buscar a qué creadora pertenece un
// dominio). Para todo lo demás usa `prisma` de "@/lib/prisma".
const globalForPrisma = globalThis as unknown as { prismaRoot: PrismaClient | undefined };

export const prismaRoot = globalForPrisma.prismaRoot ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaRoot = prismaRoot;
