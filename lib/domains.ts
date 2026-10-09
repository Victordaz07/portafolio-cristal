import { resolve4, resolveCname } from "node:dns/promises";
import { prismaRoot } from "./prisma-root";

// ─── Dominio propio de una creadora ───

/** Valores por defecto de Vercel para apuntar un dominio (si la API no da otros). */
export const VERCEL_A_RECORD = "76.76.21.21";
export const VERCEL_CNAME = "cname.vercel-dns.com";

const DOMAIN_PATTERN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Terminaciones de dos niveles comunes en Latinoamérica y otros (crislia.com.do es un dominio raíz). */
const SECOND_LEVEL = new Set([
  "com.do", "net.do", "org.do", "com.mx", "org.mx", "com.co", "net.co", "com.ar", "com.br", "com.pe", "com.ve",
  "com.ec", "com.gt", "com.pa", "com.uy", "com.py", "com.bo", "com.sv", "com.hn", "com.ni", "co.cr", "com.pr",
  "co.uk", "com.es", "com.au",
]);

/** "https://www.Crislia.com/algo" → "www.crislia.com" */
export function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

/** ¿Es el dominio raíz (crislia.com) o un subdominio (portafolio.crislia.com)? */
export function isApexDomain(domain: string) {
  const labels = domain.split(".");
  if (labels.length === 2) return true;
  return labels.length === 3 && SECOND_LEVEL.has(labels.slice(1).join("."));
}

/**
 * Mensaje si el dominio no se puede usar, o null si está bien. `ownerKind` dice si `ownerId` es
 * una creadora o una agencia (plan Crew) — un dominio no puede estar conectado a las dos a la vez,
 * así que se chequea unicidad contra ambas tablas sin importar quién lo está pidiendo.
 */
export async function domainProblem(domain: string, ownerId: string, ownerKind: "creator" | "agency" = "creator") {
  if (!DOMAIN_PATTERN.test(domain)) return "Escribe un dominio válido, por ejemplo crisliaugc.com";
  const root = (process.env.PLATFORM_ROOT_DOMAIN || "foliocrew.pro").toLowerCase().split(":")[0];
  if (domain === root || domain.endsWith(`.${root}`)) return "Ese ya es tu dirección de Foliocrew; aquí va un dominio tuyo";
  if (domain.endsWith(".vercel.app") || domain.endsWith("localhost")) return "Ese dominio no se puede usar";
  const bare = domain.replace(/^www\./, "");
  const hosts = [domain, bare, `www.${bare}`];
  const [creatorOwner, agencyOwner] = await Promise.all([
    prismaRoot.creator.findFirst({
      where: { customDomain: { in: hosts }, id: ownerKind === "creator" ? { not: ownerId } : undefined },
      select: { id: true },
    }),
    prismaRoot.agency.findFirst({
      where: { customDomain: { in: hosts }, id: ownerKind === "agency" ? { not: ownerId } : undefined },
      select: { id: true },
    }),
  ]);
  if (creatorOwner || agencyOwner) return "Ese dominio ya está conectado a otra cuenta";
  return null;
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
}

/** Registros que la creadora tiene que poner donde compró el dominio. */
export function dnsRecordsFor(domain: string, recommended?: { ipv4?: string; cname?: string }): DnsRecord[] {
  if (isApexDomain(domain)) return [{ type: "A", name: "@", value: recommended?.ipv4 || VERCEL_A_RECORD }];
  const labels = domain.split(".");
  const apexLength = SECOND_LEVEL.has(labels.slice(-2).join(".")) ? 3 : 2;
  const sub = labels.slice(0, -apexLength).join(".");
  return [{ type: "CNAME", name: sub, value: recommended?.cname || VERCEL_CNAME }];
}

/** Comprobación propia del DNS (cuando no hay token de Vercel): ¿ya apunta a Vercel? */
export async function dnsPointsToVercel(domain: string, records: DnsRecord[]) {
  try {
    const record = records[0];
    if (record.type === "A") return (await resolve4(domain)).includes(record.value);
    const cnames = await resolveCname(domain);
    return cnames.some((c) => c.replace(/\.$/, "").toLowerCase() === record.value.toLowerCase() || c.endsWith("vercel-dns.com"));
  } catch {
    return false;
  }
}

export interface DomainState {
  domain: string | null;
  status: "none" | "pending" | "verified";
  records: DnsRecord[];
  /** true = Foliocrew agrega y verifica el dominio solo (API de Vercel); false = hay que agregarlo a mano en Vercel. */
  automatic: boolean;
  message: string | null;
}
