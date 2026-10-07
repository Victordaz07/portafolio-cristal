import { NextResponse } from "next/server";
import { parseCommentEvents } from "@/lib/comment-trigger";
import { verifySignature } from "@/lib/comment-trigger-signature";
import { handleCommentEvents } from "@/lib/comment-trigger-server";

export const dynamic = "force-dynamic";

/** Verificación de Meta al registrar el webhook: devuelve el desafío si el token coincide. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (token && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === token) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/** Avisos de Meta (comentarios nuevos). Se exige la firma de Meta; sin ella no se hace nada. */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 200_000) return new NextResponse("Too large", { status: 413 });
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"), process.env.INSTAGRAM_APP_SECRET)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  // Se contesta rápido a Meta; si algo falla adentro, handleCommentEvents lo registra sin romper la respuesta.
  await handleCommentEvents(parseCommentEvents(body));
  return NextResponse.json({ ok: true });
}
