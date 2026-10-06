import { NextResponse } from "next/server";
import { z } from "zod";
import { markFollowUpSent, markReplied } from "@/lib/pitch-server";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["followup_sent", "replied"]) });

/** Seguimiento de una propuesta: «Ya envié el seguimiento» o «Respondieron». */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const brand = parsed.data.action === "replied" ? await markReplied(id, lang) : await markFollowUpSent(id, lang);
  if (!brand) return NextResponse.json({ error: t("No hay una propuesta en curso para esta marca", "There's no proposal in progress for this brand") }, { status: 409 });
  return NextResponse.json(brand);
}
