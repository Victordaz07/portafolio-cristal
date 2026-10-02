import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { PROVIDERS, isProviderConfigured } from "@/lib/social/providers";
import { PLATFORM_IDS } from "@/lib/social/types";
import { getAppUrl, getRedirectUri } from "@/lib/social/accounts";
import { isTokenEncryptionConfigured } from "@/lib/token-crypto";
import { isAiConfigured, AI_MODEL } from "@/lib/ai";
import ConnectManager, { type PlatformCard, type SetupItem } from "./ConnectManager";

export default async function AdminConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const query = await searchParams;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const requestUrl = `${proto}://${host}/admin/conectar`;

  // Solo campos públicos: los tokens nunca salen del servidor.
  const accounts = await prisma.socialAccount.findMany({
    select: {
      platform: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      followers: true,
      expiresAt: true,
      scopes: true,
      connectedAt: true,
      lastSyncAt: true,
      lastError: true,
    },
  });

  const cards: PlatformCard[] = PLATFORM_IDS.map((id) => {
    const provider = PROVIDERS[id];
    const account = accounts.find((a) => a.platform === id) ?? null;
    return {
      id,
      label: provider.label,
      configured: isProviderConfigured(provider),
      missingEnv: provider.envKeys.filter((key) => !process.env[key]),
      envKeys: provider.envKeys,
      redirectUri: getRedirectUri(id, requestUrl),
      consoleUrl: provider.consoleUrl,
      scopes: provider.scopes,
      can: provider.can,
      cannot: provider.cannot,
      account: account && JSON.parse(JSON.stringify(account)),
    };
  });

  const setup: SetupItem[] = [
    {
      key: "TOKEN_ENCRYPTION_KEY",
      ok: isTokenEncryptionConfigured(),
      help: "Cifra los tokens de las redes en la base de datos. Obligatoria para conectar cualquier red.",
    },
    {
      key: "APP_URL",
      ok: !!process.env.APP_URL,
      help: `URL fija del sitio (ej: https://tu-dominio.com). Si falta se usa ${getAppUrl(requestUrl)}, que en los previews de Vercel cambia y las redes rechazarán.`,
      optional: true,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Negocio"
        title="Conectar cuentas"
        description="Conecta tus redes con su login oficial y prueba que las APIs respondan. Nada de esto se muestra en tu sitio público."
      />
      <ConnectManager
        cards={cards}
        setup={setup}
        ai={{ configured: isAiConfigured(), model: AI_MODEL }}
        flash={{ connected: query.connected ?? null, error: query.error ?? null }}
      />
    </div>
  );
}
