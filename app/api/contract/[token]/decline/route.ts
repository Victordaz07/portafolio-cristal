import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { declineSchema } from "@/lib/contract-schemas";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { notifyCreatorAboutContract } from "@/lib/contracts-server";

export const dynamic = "force-dynamic";

/** La marca pide cambios: el contrato queda "con cambios pedidos" y se le avisa al creador con el motivo. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (tooManyAttempts(`contract-decline:${clientIp(request)}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos / Too many attempts" }, { status: 429 });
  }
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = declineSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const contract = await prismaRoot.contract.findUnique({ where: { publicToken: token } });
  if (!contract || contract.status !== "sent") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const won = await prismaRoot.contract.updateMany({
    where: { id: contract.id, status: "sent" },
    data: { status: "declined", declinedAt: new Date(), declineReason: parsed.data.reason || null },
  });
  if (won.count) await notifyCreatorAboutContract("declined", contract, { reason: parsed.data.reason });
  return NextResponse.json({ ok: true });
}
