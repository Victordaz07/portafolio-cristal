import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PROVIDERS } from "@/lib/social/providers";
import { getFreshTokens } from "@/lib/social/accounts";
import { isPlatformId } from "@/lib/social/types";
import { recordFollowerSnapshot } from "@/lib/reports";

export const dynamic = "force-dynamic";

/** Actualiza hoy los seguidores de todas las redes conectadas. */
export async function POST() {
  const accounts = await prisma.socialAccount.findMany();
  const results = [];
  for (const account of accounts) {
    if (!isPlatformId(account.platform)) continue;
    try {
      const { tokens } = await getFreshTokens(account);
      const profile = await PROVIDERS[account.platform].fetchProfile(tokens);
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { followers: profile.followers, lastSyncAt: new Date(), lastError: null },
      });
      await recordFollowerSnapshot(account.platform, profile.followers);
      results.push({ platform: account.platform, followers: profile.followers });
    } catch (error) {
      results.push({ platform: account.platform, error: error instanceof Error ? error.message : "Error" });
    }
  }
  return NextResponse.json({ results });
}

const manualSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "youtube", "facebook"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  followers: z.number().int().min(0),
});

/** Registro manual (para redes sin conectar o para cargar meses anteriores). */
export async function PUT(request: Request) {
  const parsed = manualSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa la red, la fecha y el número" }, { status: 400 });
  await recordFollowerSnapshot(parsed.data.platform, parsed.data.followers, "manual", parsed.data.date);
  return NextResponse.json({ ok: true });
}
