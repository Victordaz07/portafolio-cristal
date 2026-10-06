import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { acceptSchema } from "@/lib/contract-schemas";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { emailAcceptedCopies, notifyCreatorAboutContract, sha256 } from "@/lib/contracts-server";

export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9_-]{40,60}$/;

/**
 * La marca acepta el contrato escribiendo su nombre y su correo. Queda guardado quién, cuándo, desde qué
 * IP y un hash del texto exacto que aceptó. Solo se puede aceptar una vez, y solo si está "enviado".
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = clientIp(request);
  if (tooManyAttempts(`contract-accept:${ip}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos / Too many attempts" }, { status: 429 });
  }
  const { token } = await params;
  if (!TOKEN.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = acceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe tu nombre, tu correo y marca la casilla / Enter your name, email and tick the box" }, { status: 400 });

  const contract = await prismaRoot.contract.findUnique({ where: { publicToken: token } });
  if (!contract || contract.status !== "sent") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 300);
  // updateMany con status "sent" en el filtro: si dos personas aceptan a la vez, solo una gana.
  const won = await prismaRoot.contract.updateMany({
    where: { id: contract.id, status: "sent" },
    data: {
      status: "accepted",
      acceptedName: parsed.data.name,
      acceptedEmail: parsed.data.email,
      acceptedAt: now,
      acceptedIp: ip,
      acceptedUserAgent: userAgent,
      bodyHash: sha256(contract.bodyText),
    },
  });
  if (!won.count) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // El trato pasa a "activo" (si todavía no lo estaba o no estaba completado) y queda en el historial.
  if (contract.brandId) {
    await prismaRoot.brand.updateMany({ where: { id: contract.brandId, OR: [{ dealStatus: null }, { dealStatus: { in: ["prospect", "negotiating"] } }] }, data: { dealStatus: "active" } });
    await prismaRoot.brandEvent.create({
      data: { brandId: contract.brandId, creatorId: contract.creatorId, note: `Acuerdo aceptado por ${parsed.data.name}: ${contract.title}` },
    });
  }
  await Promise.all([
    notifyCreatorAboutContract("accepted", contract),
    emailAcceptedCopies(contract, { name: parsed.data.name, email: parsed.data.email, at: now, ip }),
  ]);
  return NextResponse.json({ ok: true });
}
