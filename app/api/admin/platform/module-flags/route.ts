import { NextResponse } from "next/server";
import { z } from "zod";
import { platformAdminUser } from "@/lib/platform-admin";
import { MODULE_KEYS, setModuleStage } from "@/lib/module-flags";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  key: z.enum(MODULE_KEYS),
  stage: z.enum(["off", "ambassadors", "public"]),
});

export async function PATCH(request: Request) {
  const { t } = await getT();
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  await setModuleStage(parsed.data.key, parsed.data.stage, admin.email);
  return NextResponse.json({ ok: true });
}
