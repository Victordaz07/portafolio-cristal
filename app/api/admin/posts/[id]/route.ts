import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postUpdateSchema, toPostData } from "@/lib/posts-server";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";
import { canAutoPublish, parseResults } from "@/lib/publish";

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
  const current = await prisma.scheduledPost.findUnique({ where: { id }, select: { networks: true, status: true, autoPublish: true } });
  if (!current) return NextResponse.json({ error: t("No se encontró la publicación", "Post not found") }, { status: 404 });
  const finalNetworks = rest.networks ?? current.networks;
  const finalStatus = rest.status ?? current.status;
  if (rest.autoPublish && !canAutoPublish(finalNetworks)) {
    return NextResponse.json({ error: t("La publicación automática solo funciona con Instagram y Facebook", "Automatic publishing only works with Instagram and Facebook") }, { status: 400 });
  }
  // Si cambian las redes o deja de estar programada, la publicación automática se apaga sola.
  if (current.autoPublish && rest.autoPublish === undefined && (!canAutoPublish(finalNetworks) || finalStatus !== "scheduled")) rest.autoPublish = false;
  if (finalStatus !== "scheduled") rest.autoPublish = false;
  // Si cambian el texto, el archivo o el tipo, los intentos fallidos de antes ya no valen: se vuelve a intentar desde cero.
  const changedContent = rest.caption !== undefined || rest.mediaUrl !== undefined || rest.mediaType !== undefined || rest.contentType !== undefined;
  let resetResults: object | undefined;
  if (changedContent) {
    const stored = await prisma.scheduledPost.findUnique({ where: { id }, select: { publishResults: true } });
    resetResults = Object.fromEntries(Object.entries(parseResults(stored?.publishResults)).filter(([, r]) => r?.status === "ok"));
  }
  const post = await prisma.scheduledPost.update({
    where: { id },
    data: {
      ...toPostData(rest),
      ...(brandId !== undefined && { brandId: brandId || null }),
      ...(changedContent && { publishAttempts: 0, publishResults: resetResults }),
    },
  });
  return NextResponse.json(post);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.scheduledPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
