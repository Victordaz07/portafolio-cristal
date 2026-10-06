import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { PROVIDERS, isProviderConfigured } from "@/lib/social/providers";
import { PLATFORM_IDS } from "@/lib/social/types";
import { getAppUrl, getRedirectUri } from "@/lib/social/accounts";
import { isTokenEncryptionConfigured } from "@/lib/token-crypto";
import { isAiConfigured, AI_MODEL } from "@/lib/ai";
import { siteConfig } from "@/lib/site-config";
import ConnectManager, { type PlatformCard, type SetupItem } from "./ConnectManager";
import { socialCopyList } from "@/lib/social/copy-en";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { t, lang } = await getT();
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
      can: socialCopyList(lang, provider.can),
      later: socialCopyList(lang, provider.later),
      cannot: socialCopyList(lang, provider.cannot),
      account: account && JSON.parse(JSON.stringify(account)),
    };
  });

  // Si el panel se abre desde otra dirección que APP_URL, la red volvería a otro dominio
  // (sin la sesión del panel) y la conexión fallaría.
  const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? null;
  const currentOrigin = `${proto}://${host}`;
  const domainMismatch = appUrl && appUrl !== currentOrigin ? { appUrl, currentOrigin } : null;

  const setup: SetupItem[] = [
    {
      key: "TOKEN_ENCRYPTION_KEY",
      ok: isTokenEncryptionConfigured(),
      help: t("Cifra los tokens de las redes en la base de datos. Obligatoria para conectar cualquier red.", "Encrypts the social network tokens in the database. Required to connect any network."),
    },
    {
      key: "PLATFORM_NAME",
      ok: !!process.env.PLATFORM_NAME,
      help: t(`Nombre comercial de la plataforma (hoy: "${siteConfig.platformName}"). Sale en las páginas de privacidad y términos; usa el mismo nombre que le pongas a las apps de cada red.`, `Platform trade name (now: "${siteConfig.platformName}"). It appears on the privacy and terms pages; use the same name you give each network's app.`),
      optional: true,
    },
    {
      key: "LEGAL_CONTACT_EMAIL",
      ok: !!process.env.LEGAL_CONTACT_EMAIL,
      help: t(`Correo para temas de privacidad y borrado de datos (hoy: ${siteConfig.legalEmail}). Ideal: uno de tu dominio, ej. privacidad@tu-dominio.com.`, `Email for privacy and data deletion matters (now: ${siteConfig.legalEmail}). Ideally one on your domain, e.g. privacy@your-domain.com.`),
      optional: true,
    },
    {
      key: "APP_URL",
      ok: !!process.env.APP_URL,
      help: t(`URL fija del sitio (ej: https://tu-dominio.com). Si falta se usa ${getAppUrl(requestUrl)}, que en los previews de Vercel cambia y las redes rechazarán.`, `Fixed site URL (e.g. https://your-domain.com). If missing, ${getAppUrl(requestUrl)} is used, which changes on Vercel previews and the networks will reject it.`),
      optional: true,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Conectar cuentas", "Connect accounts")}
        description={t("Conecta tus redes con su login oficial y prueba que las APIs respondan. Nada de esto se muestra en tu sitio público.", "Connect your social accounts with their official login and test that the APIs respond. None of this is shown on your public site.")}
      />
      <ConnectManager
        cards={cards}
        setup={setup}
        ai={{ configured: isAiConfigured(), model: AI_MODEL }}
        flash={{ connected: query.connected ?? null, error: query.error ?? null }}
        domainMismatch={domainMismatch}
        reviewUrls={[
          { label: t("Sitio web / página principal", "Website / home page"), url: `${getAppUrl(requestUrl)}/` },
          { label: t("Política de privacidad", "Privacy policy"), url: `${getAppUrl(requestUrl)}/privacidad?lang=en` },
          { label: t("Términos de servicio", "Terms of service"), url: `${getAppUrl(requestUrl)}/terminos?lang=en` },
          { label: t("Instrucciones para eliminar datos", "Data deletion instructions"), url: `${getAppUrl(requestUrl)}/eliminar-datos?lang=en` },
        ]}
      />
    </div>
  );
}
