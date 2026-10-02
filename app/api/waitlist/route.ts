import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";

export const dynamic = "force-dynamic";

const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: optional(80),
  instagram: optional(60).transform((v) => (v ? v.replace(/^@/, "") : v)),
  niche: optional(60),
  audience: z.enum(["0-1k", "1k-10k", "10k-50k", "50k+"]).optional().nullable(),
  utmSource: optional(100),
  utmMedium: optional(100),
  utmCampaign: optional(100),
  referrer: optional(300),
  /** Campo trampa: las personas no lo ven; los bots lo llenan. */
  website: z.string().optional(),
});

// Límite simple por IP (por instancia): 5 intentos por minuto.
const attempts = new Map<string, number[]>();
function tooManyAttempts(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 5;
}

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (tooManyAttempts(ip)) {
    return NextResponse.json({ error: "Demasiados intentos; prueba en un minuto" }, { status: 429 });
  }
  const parsed = waitlistSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe un correo válido" }, { status: 400 });
  const { website, ...data } = parsed.data;
  // Bot: responde como si todo estuviera bien, pero no guarda nada.
  if (website) return NextResponse.json({ ok: true, position: null });

  const existing = await prismaRoot.waitlistEntry.findUnique({ where: { email: data.email } });
  const entry =
    existing ??
    (await prismaRoot.waitlistEntry.create({ data: { ...data, audience: data.audience ?? null } }));
  const position = await prismaRoot.waitlistEntry.count({ where: { createdAt: { lte: entry.createdAt } } });
  return NextResponse.json({ ok: true, position, already: Boolean(existing) });
}
