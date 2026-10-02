import type { SocialAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/token-crypto";
import { PROVIDERS } from "./providers";
import type { PlatformId, RecentItem, SocialProfile, StoredTokens, TokenSet } from "./types";

/**
 * URL base pública de la app. En producción conviene fijarla con APP_URL
 * (las URLs de preview de Vercel cambian y las redes exigen la URL exacta).
 */
export function getAppUrl(requestUrl: string) {
  return (process.env.APP_URL || new URL(requestUrl).origin).replace(/\/$/, "");
}

export function getRedirectUri(platform: PlatformId, requestUrl: string) {
  return `${getAppUrl(requestUrl)}/api/admin/connect/${platform}/callback`;
}

function storedTokens(account: SocialAccount): StoredTokens {
  return {
    accessToken: decryptToken(account.accessToken),
    refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : null,
    expiresAt: account.expiresAt,
    externalId: account.externalId,
    connectedAt: account.connectedAt,
  };
}

function profileData(profile: SocialProfile) {
  return {
    externalId: profile.externalId,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    followers: profile.followers,
  };
}

/** Guarda (o reemplaza) la conexión de una red tras el login OAuth. */
export async function saveConnection(platform: PlatformId, tokens: TokenSet, profile: SocialProfile) {
  const data = {
    ...profileData(profile),
    accessToken: encryptToken(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
    expiresAt: tokens.expiresAt ?? null,
    scopes: tokens.scopes,
    lastSyncAt: new Date(),
    lastError: null,
  };
  return prisma.socialAccount.upsert({
    where: { platform },
    create: { platform, ...data },
    update: { ...data, connectedAt: new Date() },
  });
}

export interface ConnectionTestResult {
  ok: boolean;
  refreshed: boolean;
  profile?: SocialProfile;
  recent?: RecentItem[];
  error?: string;
}

/** Renueva el token si hace falta, trae perfil + publicaciones recientes y guarda el resultado. */
export async function testConnection(platform: PlatformId): Promise<ConnectionTestResult> {
  const provider = PROVIDERS[platform];
  const account = await prisma.socialAccount.findUnique({ where: { platform } });
  if (!account) return { ok: false, refreshed: false, error: "Esta red no está conectada" };

  let refreshed = false;
  try {
    let tokens = storedTokens(account);
    const renewed = provider.refresh ? await provider.refresh(tokens) : null;
    if (renewed) {
      refreshed = true;
      tokens = {
        ...tokens,
        accessToken: renewed.accessToken,
        refreshToken: renewed.refreshToken ?? tokens.refreshToken,
        expiresAt: renewed.expiresAt ?? null,
      };
      await prisma.socialAccount.update({
        where: { platform },
        data: {
          accessToken: encryptToken(tokens.accessToken),
          refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
          expiresAt: tokens.expiresAt,
        },
      });
    }

    const profile = await provider.fetchProfile(tokens);
    const recent = await provider.fetchRecent(tokens);
    await prisma.socialAccount.update({
      where: { platform },
      data: { ...profileData(profile), lastSyncAt: new Date(), lastError: null },
    });
    return { ok: true, refreshed, profile, recent };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await prisma.socialAccount.update({ where: { platform }, data: { lastError: message.slice(0, 500) } });
    return { ok: false, refreshed, error: message };
  }
}
