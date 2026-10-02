import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { PROVIDERS, isProviderConfigured } from "@/lib/social/providers";
import { isPlatformId } from "@/lib/social/types";
import { getAppUrl, getRedirectUri } from "@/lib/social/accounts";
import { isTokenEncryptionConfigured } from "@/lib/token-crypto";

export const dynamic = "force-dynamic";

/** Inicia el login OAuth de la red: guarda un "state" anti-CSRF en cookie y redirige. */
export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const back = (error: string) =>
    NextResponse.redirect(`${getAppUrl(request.url)}/admin/conectar?error=${encodeURIComponent(error)}`);

  if (!isPlatformId(platform)) return back("Red desconocida");
  const provider = PROVIDERS[platform];
  if (!isProviderConfigured(provider)) {
    return back(`Faltan ${provider.envKeys.join(" y ")} en las variables de entorno`);
  }
  if (!isTokenEncryptionConfigured()) return back("Falta TOKEN_ENCRYPTION_KEY en las variables de entorno");

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(provider.authorizeUrl(getRedirectUri(platform, request.url), state));
  response.cookies.set(`oauth_state_${platform}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/connect",
    maxAge: 600,
  });
  return response;
}
