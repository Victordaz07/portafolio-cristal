import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prismaRoot } from "@/lib/prisma-root";
import { platformOrigin } from "@/lib/site-url";
import { deleteMetaConnections, parseSignedRequest, readSignedRequest } from "@/lib/social/meta-signed-request";

export const dynamic = "force-dynamic";

/**
 * "Data deletion request URL" de Meta: borra los datos de esa persona y responde con
 * la dirección donde puede ver el estado y un código de confirmación (formato que pide Meta).
 */
export async function POST(request: Request) {
  const userId = parseSignedRequest(await readSignedRequest(request));
  if (!userId) return NextResponse.json({ error: "signed_request inválido" }, { status: 400 });
  const deletedAccounts = await deleteMetaConnections(userId);
  const code = randomBytes(6).toString("hex");
  await prismaRoot.dataDeletionRequest.create({ data: { code, platform: "meta", externalId: userId, deletedAccounts } });
  return NextResponse.json({ url: `${await platformOrigin()}/eliminar-datos?codigo=${code}`, confirmation_code: code });
}
