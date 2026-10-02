import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { getSession } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** Enlace del correo de confirmación: marca el correo como confirmado y lleva al panel (o al login). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = await consumeAuthToken(url.searchParams.get("token") ?? "", "verify");
  if (userId) await prismaRoot.adminUser.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  const status = userId ? "confirmado" : "vencido";
  const target = (await getSession()) ? `/admin/cuenta?correo=${status}` : `/admin/login?correo=${status}`;
  return NextResponse.redirect(new URL(target, url));
}
