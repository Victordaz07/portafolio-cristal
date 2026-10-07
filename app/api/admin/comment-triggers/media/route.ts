import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { getFreshTokens } from "@/lib/social/accounts";
import { PROVIDERS } from "@/lib/social/providers";

export const dynamic = "force-dynamic";

/** Publicaciones recientes de Instagram para elegir en cuál va la regla. */
export async function GET() {
  const { t } = await getT();
  const account = await prisma.socialAccount.findFirst({ where: { platform: "instagram" } });
  if (!account) return NextResponse.json({ error: t("Conecta Instagram primero", "Connect Instagram first") }, { status: 400 });
  try {
    const { tokens } = await getFreshTokens(account);
    const items = await PROVIDERS.instagram.fetchRecent(tokens, 12);
    return NextResponse.json({ items: items.map((i) => ({ id: i.id, title: i.title, url: i.url, thumbnailUrl: i.thumbnailUrl, publishedAt: i.publishedAt })) });
  } catch (error) {
    console.error("Comentario → DM: no se pudieron traer las publicaciones", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: t("No se pudieron traer tus publicaciones; inténtalo otra vez", "Couldn't load your posts; try again") }, { status: 502 });
  }
}
