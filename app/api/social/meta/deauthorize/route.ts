import { NextResponse } from "next/server";
import { deleteMetaConnections, parseSignedRequest, readSignedRequest } from "@/lib/social/meta-signed-request";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** "Deauthorize callback URL" de Meta: la persona quitó Foliocrew desde Instagram o Facebook. */
export async function POST(request: Request) {
  const { t } = await getT();
  const userId = parseSignedRequest(await readSignedRequest(request));
  if (!userId) return NextResponse.json({ error: t("signed_request inválido", "Invalid signed_request") }, { status: 400 });
  await deleteMetaConnections(userId);
  return NextResponse.json({ ok: true });
}
