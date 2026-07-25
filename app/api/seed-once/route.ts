import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/prisma/seed";

// Endpoint temporal de un solo uso para cargar el seed inicial en producción,
// porque este entorno no tiene salida de red directa a Postgres. Se borra
// apenas se confirme que el seed corrió bien.
export const dynamic = "force-dynamic";

const SEED_TOKEN = "fd32cc3ac93b80f84ffd0c3c41d34a5bcd55d1ff77a28433";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== SEED_TOKEN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await seedDatabase(prisma);
  return NextResponse.json({ ok: true });
}
