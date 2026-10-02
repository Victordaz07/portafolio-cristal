import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PROVIDERS } from "@/lib/social/providers";
import { isPlatformId } from "@/lib/social/types";
import { getAppUrl, getRedirectUri, saveConnection } from "@/lib/social/accounts";

export const dynamic = "force-dynamic";

/** La red redirige aquí tras el login: valida el state, cambia el code por tokens y guarda la cuenta. */
export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const url = new URL(request.url);
  const appUrl = getAppUrl(request.url);
  const done = (query: string) => {
    const response = NextResponse.redirect(`${appUrl}/admin/conectar?${query}`);
    response.cookies.set(`oauth_state_${platform}`, "", { path: "/api/admin/connect", maxAge: 0 });
    return response;
  };
  const fail = (message: string) => done(`error=${encodeURIComponent(message)}`);

  if (!isPlatformId(platform)) return fail("Red desconocida");

  // La red puede devolver un error (p. ej. si cancelaste el permiso).
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (providerError) return fail(`${PROVIDERS[platform].label}: ${providerError}`);

  const expectedState = (await cookies()).get(`oauth_state_${platform}`)?.value;
  const state = url.searchParams.get("state");
  if (!expectedState || !state || state !== expectedState) {
    return fail("La sesión de conexión expiró o no coincide. Vuelve a intentarlo.");
  }

  const code = url.searchParams.get("code");
  if (!code) return fail("La red no devolvió un código de autorización");

  try {
    const provider = PROVIDERS[platform];
    const tokens = await provider.exchangeCode(code, getRedirectUri(platform, request.url));
    const profile = await provider.fetchProfile({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      expiresAt: tokens.expiresAt ?? null,
      externalId: "",
      connectedAt: new Date(),
    });
    await saveConnection(platform, tokens, profile);
    return done(`connected=${platform}`);
  } catch (error) {
    return fail(`${PROVIDERS[platform].label}: ${error instanceof Error ? error.message : "error desconocido"}`);
  }
}
