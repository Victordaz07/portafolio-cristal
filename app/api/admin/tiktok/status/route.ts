import { NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/admin-lang-server";
import { fetchPublishStatus } from "@/lib/social/tiktok-posting";
import { loadPostingAccount, postingErrorResponse } from "@/lib/social/tiktok-posting-server";

export const dynamic = "force-dynamic";

const schema = z.object({ publishId: z.string().min(1).max(64) });

/** Estado de una publicación o borrador (la pantalla lo consulta cada pocos segundos). */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Falta el id de la publicación", "The post id is missing") }, { status: 400 });
  const loaded = await loadPostingAccount(t, ["draft", "direct"]);
  if ("response" in loaded) return loaded.response;
  try {
    return NextResponse.json(await fetchPublishStatus(loaded.accessToken, parsed.data.publishId));
  } catch (error) {
    return postingErrorResponse(t, loaded.account, error);
  }
}
