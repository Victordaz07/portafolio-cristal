import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { notifyCreatorAboutInvoice } from "@/lib/invoices-server";

export const dynamic = "force-dynamic";

/** "Ya pagamos": la marca avisa que pagó. No cambia el estado: el creador lo confirma en el panel. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (tooManyAttempts(`invoice-paid:${clientIp(request)}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos / Too many attempts" }, { status: 429 });
  }
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const invoice = await prismaRoot.invoice.findUnique({ where: { publicToken: token } });
  if (!invoice || invoice.status !== "sent") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const marked = await prismaRoot.invoice.updateMany({ where: { id: invoice.id, claimedPaidAt: null }, data: { claimedPaidAt: new Date() } });
  if (marked.count) await notifyCreatorAboutInvoice("claimed", invoice);
  return NextResponse.json({ ok: true });
}
