import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser, logAgencyAction } from "@/lib/agency";
import { createCreatorAccount, rotateAccessCode, SLUG_PATTERN, slugProblem } from "@/lib/creators";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ name: z.string().trim().min(1).max(80), slug: z.string().regex(SLUG_PATTERN), email: z.string().email() });

/** Agrega una creadora nueva a la cartera de la agencia, ya en plan Crew, con su código de acceso listo. */
export async function POST(request: Request) {
  const { t } = await getT();
  const agency = await agencyUser();
  if (!agency || !agency.owner) return NextResponse.json({ error: t("Solo para el dueño de la agencia", "Agency owner only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });

  const record = await prismaRoot.agency.findUniqueOrThrow({ where: { id: agency.agencyId } });
  const count = await prismaRoot.creator.count({ where: { agencyId: agency.agencyId } });
  if (count >= record.maxCreators) return NextResponse.json({ error: t("Tu cartera está llena. Escríbenos si necesitas más cupos.", "Your roster is full. Contact us if you need more seats.") }, { status: 400 });

  const slug = parsed.data.slug.toLowerCase();
  const problem = await slugProblem(slug, t);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  if (await prismaRoot.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } })) {
    return NextResponse.json({ error: t("Ya existe una cuenta con ese correo", "An account with that email already exists") }, { status: 400 });
  }

  // La contraseña no se usa en el día a día (ella entra con su código de acceso): se genera al azar
  // y no se muestra. Si quiere entrar con contraseña más adelante, puede restablecerla en /admin/recuperar.
  const { creator, user } = await createCreatorAccount({ name: parsed.data.name, slug, email: parsed.data.email, password: randomBytes(24).toString("base64url") });
  await prismaRoot.creator.update({ where: { id: creator.id }, data: { agencyId: agency.agencyId, plan: "crew", trialEndsAt: null } });
  const code = await rotateAccessCode(user.id);
  await logAgencyAction(agency.agencyId, agency.email, "add_client", creator.id, `Creadora: ${parsed.data.name}`);

  return NextResponse.json({ creatorId: creator.id, accessCode: code });
}
