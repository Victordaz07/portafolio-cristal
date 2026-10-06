import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { ADMIN_LANG_COOKIE } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

const schema = z.object({ lang: z.enum(["es", "en"]) });

/** Cambia el idioma del panel: cookie para este navegador y preferencia en la cuenta (correos, otros equipos). */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  const { lang } = parsed.data;
  const session = await getSession();
  if (session && !session.actorId) {
    await prismaRoot.adminUser.update({ where: { id: session.userId }, data: { language: lang } }).catch(() => null);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}
