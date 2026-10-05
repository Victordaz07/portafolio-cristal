import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { dataRequestKindLabel, isDataRequestKind } from "@/lib/data-export";
import { teamEmailsWith } from "@/lib/team";
import { tooManyAttempts } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { noticeEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.string().refine(isDataRequestKind),
  detail: z.string().trim().max(3000).default(""),
});

/** La cuenta pide una copia, recuperar algo o borrar su cuenta. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("Este pedido lo hace la cuenta, no el equipo", "Only the account can make this request, not the team") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Elige qué necesitas", "Choose what you need") }, { status: 400 });
  const { kind, detail } = parsed.data;
  if (kind === "recover" && detail.length < 5) {
    return NextResponse.json({ error: t("Cuéntanos qué se perdió y más o menos cuándo", "Tell us what was lost and roughly when") }, { status: 400 });
  }
  if (tooManyAttempts(`data-request:${session.creatorId}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: t("Mandaste varios pedidos seguidos. Espera un rato.", "You sent several requests in a row. Wait a bit.") }, { status: 429 });
  }
  const [user, creator] = await Promise.all([
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true } }),
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true } }),
  ]);
  if (!user) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const created = await prisma.dataRequest.create({ data: { kind, detail, requestedBy: user.email } });

  try {
    const origin = await platformOrigin();
    const mail = noticeEmail({
      origin,
      subject: `Pedido de datos: ${dataRequestKindLabel(kind)} (${creator?.name ?? user.email})`,
      title: "Nuevo pedido de datos",
      lines: [`${creator?.name ?? "Una cuenta"} (${user.email}) pidió: ${dataRequestKindLabel(kind)}.`],
      quote: detail || undefined,
      button: { label: "Abrir el centro de datos", url: `${origin}/admin/equipo/datos` },
    });
    const recipients = await teamEmailsWith("data");
    await Promise.all(recipients.map((to) => sendEmail({ to, ...mail, replyTo: user.email })));
  } catch (error) {
    console.error("No se pudo avisar al equipo del pedido de datos", error);
  }
  return NextResponse.json({ ok: true, id: created.id });
}
