// Conexión con la API de Vercel para agregar y verificar los dominios propios de las creadoras.
// Variables: VERCEL_API_TOKEN (Settings → Tokens), VERCEL_PROJECT_ID y VERCEL_TEAM_ID.
// Sin ellas, el panel funciona en modo manual (el dominio se agrega a mano en Vercel).

const API = "https://api.vercel.com";

export function vercelDomainsEnabled() {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

async function vercel<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(API + path);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string } }).error;
    const err = new Error(error?.message || `Vercel respondió ${response.status}`) as Error & { code?: string; status?: number };
    err.code = error?.code;
    err.status = response.status;
    throw err;
  }
  return data as T;
}

const project = () => encodeURIComponent(process.env.VERCEL_PROJECT_ID!);

export interface VercelDomainStatus {
  verified: boolean;
  misconfigured: boolean;
  /** Registros TXT que pide Vercel cuando el dominio ya se usó en otra cuenta de Vercel. */
  verification: { type: string; domain: string; value: string }[];
  recommended: { ipv4?: string; cname?: string };
}

export async function addProjectDomain(domain: string) {
  try {
    await vercel(`/v10/projects/${project()}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  } catch (error) {
    // Ya estaba agregado a este proyecto: no es un problema.
    if ((error as { code?: string }).code === "domain_already_in_use_by_project") return;
    throw error;
  }
}

export async function removeProjectDomain(domain: string) {
  try {
    await vercel(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`, { method: "DELETE" });
  } catch (error) {
    if ((error as { status?: number }).status === 404) return;
    throw error;
  }
}

export async function projectDomainStatus(domain: string): Promise<VercelDomainStatus> {
  const name = encodeURIComponent(domain);
  let info = await vercel<{ verified: boolean; verification?: VercelDomainStatus["verification"] }>(
    `/v9/projects/${project()}/domains/${name}`
  );
  if (!info.verified) {
    info = await vercel<typeof info>(`/v9/projects/${project()}/domains/${name}/verify`, { method: "POST" }).catch(() => info);
  }
  const config = await vercel<{
    misconfigured: boolean;
    recommendedIPv4?: { rank: number; value: string[] }[];
    recommendedCNAME?: { rank: number; value: string }[];
  }>(`/v6/domains/${name}/config`);
  const ipv4 = config.recommendedIPv4?.sort((a, b) => a.rank - b.rank)[0]?.value?.[0];
  const cname = config.recommendedCNAME?.sort((a, b) => a.rank - b.rank)[0]?.value?.replace(/\.$/, "");
  return {
    verified: info.verified,
    misconfigured: config.misconfigured,
    verification: info.verification ?? [],
    recommended: { ipv4, cname },
  };
}
