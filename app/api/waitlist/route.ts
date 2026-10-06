import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { sendEmail } from "@/lib/email";
import { waitlistJoinedEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

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

export async function POST(request: Request) {
  const { t, lang } = await getT();
  // Límite simple por IP: 5 intentos por minuto.
  if (tooManyAttempts(`waitlist:${clientIp(request)}`, 5)) {
    return NextResponse.json({ error: t("Demasiados intentos; prueba en un minuto", "Too many attempts; try again in a minute") }, { status: 429 });
  }
  const parsed = waitlistSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe un correo válido", "Enter a valid email") }, { status: 400 });
  const { website, ...data } = parsed.data;
  // Bot: responde como si todo estuviera bien, pero no guarda nada.
  if (website) return NextResponse.json({ ok: true, position: null });

  const existing = await prismaRoot.waitlistEntry.findUnique({ where: { email: data.email } });
  const entry =
    existing ??
    (await prismaRoot.waitlistEntry.create({ data: { ...data, audience: data.audience ?? null, language: lang } }));
  const position = await prismaRoot.waitlistEntry.count({ where: { createdAt: { lte: entry.createdAt } } });
  if (!existing) {
    const origin = await platformOrigin();
    const mail = waitlistJoinedEmail({ lang, origin, position, shareUrl: `${origin}/?utm_source=referido` });
    await sendEmail({ to: entry.email, ...mail }).catch(() => {});
  }
  return NextResponse.json({ ok: true, position, already: Boolean(existing) });
}
