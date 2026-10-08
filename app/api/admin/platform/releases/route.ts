import { NextResponse } from "next/server";
import { z } from "zod";
import { logPlatformAction, platformAdminUser } from "@/lib/platform-admin";
import { getT } from "@/lib/admin-lang-server";
import { RELEASE_LEVELS, RELEASE_MODULES, levelLabel, releaseModule } from "@/lib/releases";
import { setReleaseLevels } from "@/lib/releases-server";

export const dynamic = "force-dynamic";

const MODULE_IDS = RELEASE_MODULES.map((m) => m.id) as [string, ...string[]];

const schema = z.object({
  ids: z.array(z.enum(MODULE_IDS)).min(1).max(MODULE_IDS.length),
  level: z.enum(RELEASE_LEVELS),
});

/** Centro de mando → Lanzamientos: cambia quién ve uno o varios módulos. Solo quien administra Foliocrew. */
export async function PATCH(request: Request) {
  const { t } = await getT();
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { ids, level } = parsed.data;
  const changed = await setReleaseLevels(Array.from(new Set(ids)), level, admin.email);
  if (changed.length) {
    const detail = changed.map((c) => `${releaseModule(c.id)?.name ?? c.id}: ${levelLabel(c.from)} → ${levelLabel(level)}`).join(", ");
    await logPlatformAction(admin.email, "release", null, detail);
  }
  return NextResponse.json({ ok: true, changed: changed.map((c) => c.id) });
}
