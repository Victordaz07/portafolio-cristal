import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema, toPostData } from "@/lib/posts-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa los datos" }, { status: 400 });
  }
  const data = toPostData(parsed.data);
  const post = await prisma.scheduledPost.create({
    data: { ...data, scheduledFor: data.scheduledFor!, brandId: parsed.data.brandId || null },
  });
  return NextResponse.json(post, { status: 201 });
}
