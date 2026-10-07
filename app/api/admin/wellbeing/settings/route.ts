import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { loadSchema } from "@/lib/wellbeing-schemas";
import { saveLoadLimit } from "@/lib/wellbeing-server";
import { MAX_LOAD_LIMIT } from "@/lib/wellbeing";

export const dynamic = "force-dynamic";

/** Cuántas entregas en 7 días son demasiadas para ti. */
export async function PATCH(request: Request) {
  const { t } = await getT();
  const parsed = loadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t(`Elige un número entre 1 y ${MAX_LOAD_LIMIT}`, `Choose a number between 1 and ${MAX_LOAD_LIMIT}`) }, { status: 400 });
  await saveLoadLimit(parsed.data.loadLimit);
  return NextResponse.json({ ok: true });
}
