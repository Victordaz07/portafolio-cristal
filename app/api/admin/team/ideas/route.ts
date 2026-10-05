import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { isIdeaCategory } from "@/lib/ideas";
import { requireRole, teamDisplayName } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(3000).default(""),
  category: z.string().refine(isIdeaCategory),
});

/** Idea interna del equipo (no viene de una cuenta). */
export async function POST(request: Request) {
  const { t } = await getT();
  const user = await requireRole("growth");
  if (!user) return NextResponse.json({ error: t("Solo el equipo del Centro de sugerencias", "Suggestions center team only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe la idea en una frase", "Write the idea in one sentence") }, { status: 400 });
  const idea = await prismaRoot.idea.create({
    data: { ...parsed.data, creatorId: null, authorEmail: user.email, authorName: teamDisplayName(user) },
  });
  return NextResponse.json({ ok: true, id: idea.id });
}
