import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postUpdateSchema, toPostData } from "@/lib/posts-server";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = postUpdateSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: validationMessage(t, parsed.error.issues[0]?.message) }, { status: 400 });
  }
  if ((parsed.data.date === undefined) !== (parsed.data.time === undefined)) {
    return NextResponse.json({ error: t("Envía la fecha y la hora juntas", "Send the date and time together") }, { status: 400 });
  }
  const { brandId, ...rest } = parsed.data;
  const post = await prisma.scheduledPost.update({
    where: { id },
    data: { ...toPostData(rest), ...(brandId !== undefined && { brandId: brandId || null }) },
  });
  return NextResponse.json(post);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.scheduledPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
