export const PLATFORM_IDS = ["instagram", "facebook", "tiktok", "youtube"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export function isPlatformId(value: string): value is PlatformId {
  return (PLATFORM_IDS as readonly string[]).includes(value);
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes: string[];
}

export interface SocialProfile {
  externalId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  followers: number | null;
  /** Id de la persona para esta app (Meta lo manda al desconectar o pedir borrar datos). */
  scopedId?: string | null;
  /** Datos extra para mostrar en la prueba (publicaciones, páginas, etc.). */
  extra: Record<string, string | number | null>;
}

export interface RecentItem {
  id: string;
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  /** Métricas con etiqueta para mostrar en la prueba de conexión. */
  metrics: Record<string, number | null>;
  /** Las mismas métricas en formato fijo, para sincronizarlas con el Feed. */
  stats: { views: number | null; likes: number | null; comments: number | null; shares: number | null };
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  externalId: string;
  connectedAt: Date;
}

export interface SocialProvider {
  id: PlatformId;
  label: string;
  /** Variables de entorno: [id de la app, secreto]. */
  envKeys: [string, string];
  scopes: string[];
  consoleUrl: string;
  /** Lo que hace esta conexión con los permisos que pide hoy. */
  can: string[];
  /** Lo que la API permite pero necesita más permisos o la aprobación de la red. */
  later: string[];
  cannot: string[];
  authorizeUrl(redirectUri: string, state: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>;
  fetchProfile(tokens: StoredTokens): Promise<SocialProfile>;
  fetchRecent(tokens: StoredTokens, limit?: number): Promise<RecentItem[]>;
  /** Renueva el token si hace falta; null si no hay nada que renovar. */
  refresh?(tokens: StoredTokens): Promise<TokenSet | null>;
}
