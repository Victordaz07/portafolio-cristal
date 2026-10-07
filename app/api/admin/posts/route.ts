import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema, toPostData } from "@/lib/posts-server";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";
import { canAutoPublish } from "@/lib/publish";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: validationMessage(t, parsed.error.issues[0]?.message) }, { status: 400 });
  }
  if (parsed.data.autoPublish && !canAutoPublish(parsed.data.networks)) {
    return NextResponse.json({ error: t("La publicación automática solo funciona con Instagram y Facebook", "Automatic publishing only works with Instagram and Facebook") }, { status: 400 });
  }
  const data = toPostData({ ...parsed.data, autoPublish: Boolean(parsed.data.autoPublish) && parsed.data.status === "scheduled" });
  const post = await prisma.scheduledPost.create({
    data: { ...data, scheduledFor: data.scheduledFor!, brandId: parsed.data.brandId || null },
  });
  return NextResponse.json(post, { status: 201 });
}
