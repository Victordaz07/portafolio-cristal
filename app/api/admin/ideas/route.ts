import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { isIdeaCategory } from "@/lib/ideas";
import { tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(3000).default(""),
  category: z.string().refine(isIdeaCategory),
});

/** La cuenta envía una sugerencia al centro de mejora continua. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe tu idea en una frase", "Write your idea in one sentence") }, { status: 400 });
  if (tooManyAttempts(`ideas:${session.creatorId}`, 15, 60 * 60_000)) {
    return NextResponse.json({ error: t("Enviaste muchas ideas seguidas. ¡Gracias! Espera un rato.", "You sent many ideas in a row. Thank you! Wait a bit.") }, { status: 429 });
  }
  const user = await prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true, name: true } });
  if (!user) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const idea = await prismaRoot.idea.create({
    data: { ...parsed.data, creatorId: session.creatorId, authorEmail: user.email, authorName: user.name },
  });
  return NextResponse.json({ ok: true, id: idea.id });
}
