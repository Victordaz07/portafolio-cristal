import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

// Cambios parciales: leído y/o respondido (respondido también lo marca como leído).
const messageUpdateSchema = z
  .object({ read: z.boolean().optional(), replied: z.boolean().optional() })
  .refine((data) => data.read !== undefined || data.replied !== undefined);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = messageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  }

  const { read, replied } = parsed.data;
  const message = await prisma.contactMessage.update({
    where: { id },
    data: {
      ...(read !== undefined ? { read } : {}),
      ...(replied !== undefined ? { repliedAt: replied ? new Date() : null, ...(replied ? { read: true } : {}) } : {}),
    },
  });
  return NextResponse.json(message);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contactMessage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
