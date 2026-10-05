import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema, toPostData } from "@/lib/posts-server";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: validationMessage(t, parsed.error.issues[0]?.message) }, { status: 400 });
  }
  const data = toPostData(parsed.data);
  const post = await prisma.scheduledPost.create({
    data: { ...data, scheduledFor: data.scheduledFor!, brandId: parsed.data.brandId || null },
  });
  return NextResponse.json(post, { status: 201 });
}
