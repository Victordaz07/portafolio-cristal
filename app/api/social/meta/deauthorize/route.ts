import { NextResponse } from "next/server";
import { deleteMetaConnections, parseSignedRequest, readSignedRequest } from "@/lib/social/meta-signed-request";

export const dynamic = "force-dynamic";

/** "Deauthorize callback URL" de Meta: la persona quitó Foliocrew desde Instagram o Facebook. */
export async function POST(request: Request) {
  const userId = parseSignedRequest(await readSignedRequest(request));
  if (!userId) return NextResponse.json({ error: "signed_request inválido" }, { status: 400 });
  await deleteMetaConnections(userId);
  return NextResponse.json({ ok: true });
}
