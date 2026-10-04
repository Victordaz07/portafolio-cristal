import { NextResponse } from "next/server";
import { fetchInstagramComments, isInstagramConnected, type CommentStats } from "@/lib/social/instagram-comments";

export const dynamic = "force-dynamic";

/** Comentarios recientes de Instagram para la Bandeja. */
export async function GET() {
  if (!(await isInstagramConnected())) return NextResponse.json({ connected: false, comments: [] });
  try {
    const stats: CommentStats = { reported: 0, own: 0 };
    const comments = await fetchInstagramComments(8, stats);
    return NextResponse.json({ connected: true, comments, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los comentarios";
    return NextResponse.json({ connected: true, comments: [], error: message }, { status: 502 });
  }
}
