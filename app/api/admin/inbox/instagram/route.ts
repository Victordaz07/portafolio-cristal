import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { diagnoseInstagramComments, fetchInstagramComments, isInstagramConnected, type CommentStats } from "@/lib/social/instagram-comments";

export const dynamic = "force-dynamic";

/** Comentarios recientes de Instagram para la Bandeja. */
export async function GET(request: Request) {
  // ?diagnostico=1 → qué responde Meta por publicación (sin tokens), para depurar una Bandeja vacía.
  if (new URL(request.url).searchParams.get("diagnostico") === "1") {
    return NextResponse.json(await diagnoseInstagramComments());
  }
  if (!(await isInstagramConnected())) return NextResponse.json({ connected: false, comments: [] });
  try {
    const stats: CommentStats = { reported: 0, own: 0 };
    const comments = await fetchInstagramComments(8, stats);
    return NextResponse.json({ connected: true, comments, stats });
  } catch (error) {
    const { t } = await getT();
    const message = error instanceof Error ? error.message : t("No se pudieron cargar los comentarios", "Couldn't load the comments");
    return NextResponse.json({ connected: true, comments: [], error: message }, { status: 502 });
  }
}
