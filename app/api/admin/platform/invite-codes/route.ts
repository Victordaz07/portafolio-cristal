import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { platformAdminUser } from "@/lib/platform-admin";
import { generateInviteCode } from "@/lib/invite-codes";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const codes = await prismaRoot.inviteCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ codes });
}

const createSchema = z.object({
  label: z.string().trim().max(120).optional(),
  /** Vacío/0 = sin tope de usos. */
  maxUses: z.number().int().positive().max(10_000).nullable().optional(),
  /** Días a partir de hoy; vacío = sin vencimiento. */
  expiresInDays: z.number().int().positive().max(365).nullable().optional(),
});

export async function POST(request: Request) {
  const { t } = await getT();
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });

  let code = generateInviteCode();
  while (await prismaRoot.inviteCode.findUnique({ where: { code } })) code = generateInviteCode();

  const created = await prismaRoot.inviteCode.create({
    data: {
      code,
      label: parsed.data.label || null,
      maxUses: parsed.data.maxUses || null,
      expiresAt: parsed.data.expiresInDays ? new Date(Date.now() + parsed.data.expiresInDays * 86_400_000) : null,
      createdBy: admin.email,
    },
  });
  return NextResponse.json({ code: created });
}
