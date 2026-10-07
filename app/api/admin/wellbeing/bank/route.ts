import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { bankSchema } from "@/lib/wellbeing-schemas";
import { MAX_BANK_ITEMS } from "@/lib/wellbeing";

export const dynamic = "force-dynamic";

/** Guarda una idea o pieza en el banco de contenido. */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = bankSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe al menos un título para la idea", "Write at least a title for the idea") }, { status: 400 });
  if ((await prisma.contentBankItem.count()) >= MAX_BANK_ITEMS) return NextResponse.json({ error: t(`El banco puede tener hasta ${MAX_BANK_ITEMS} ideas`, `The bank can hold up to ${MAX_BANK_ITEMS} ideas`) }, { status: 400 });
  const { mediaUrl, ...rest } = parsed.data;
  const item = await prisma.contentBankItem.create({ data: { ...rest, mediaUrl: mediaUrl || null, mediaType: mediaUrl ? parsed.data.mediaType ?? "video" : null } });
  return NextResponse.json(item, { status: 201 });
}
