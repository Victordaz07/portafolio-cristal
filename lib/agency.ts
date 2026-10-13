import { prismaRoot } from "./prisma-root";
import { getSession } from "./tenant";
import { isPlatformAdminEmail } from "./platform-admin";

// Agencia de Foliocrew (plan Crew): una cuenta que administra una cartera de creadoras, con una
// sola factura. Quien la administra entra con su correo+contraseña de siempre (su AdminUser), pero
// además tiene agencyId/agencyRole puestos. "owner" puede todo (agregar/quitar creadoras, equipo,
// facturación); "cm" (community manager) solo entra a las cuentas de la cartera.

export type AgencyRole = "owner" | "cm";

export interface AgencyUser {
  id: string;
  email: string;
  name: string | null;
  agencyId: string;
  owner: boolean;
  role: AgencyRole;
}

// Slug de la demo completa que crea scripts/seed-agency-demo.ts. Si ya se corrió ese script, el
// Dueño de Foliocrew ve esos datos de ejemplo (más ricos); si no, ve una agencia vacía que se crea
// sola la primera vez. Ninguna de las dos es una agencia real de cliente.
const DEMO_AGENCY_SLUG = "vibe-creators";
const SANDBOX_AGENCY_SLUG = "crew-sandbox";

/** La agencia que ve el Dueño al probar el plan Crew desde su propio menú (ver §AdminShell). */
async function previewAgencyId() {
  const demo = await prismaRoot.agency.findUnique({ where: { slug: DEMO_AGENCY_SLUG }, select: { id: true } });
  if (demo) return demo.id;
  const sandbox = await prismaRoot.agency.upsert({
    where: { slug: SANDBOX_AGENCY_SLUG },
    update: {},
    create: { name: "Crew (modo prueba)", slug: SANDBOX_AGENCY_SLUG, maxCreators: 5, status: "active", comp: true },
    select: { id: true },
  });
  return sandbox.id;
}

/**
 * La persona de agencia con sesión iniciada (null si no lo es). No cuenta mientras está
 * "entrando como" una de sus creadoras: ahí ve el panel de esa cuenta, no el de su agencia.
 *
 * El Dueño de Foliocrew (o cualquier correo en PLATFORM_ADMIN_EMAILS) que no tenga una agencia
 * propia entra automáticamente a una agencia de prueba: así puede ver y probar el panel de Crew
 * sin salir de su cuenta ni crear una agencia real (ver previewAgencyId()).
 */
export async function agencyUser(): Promise<AgencyUser | null> {
  const session = await getSession();
  if (!session || session.actorId) return null;
  const user = await prismaRoot.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, agencyId: true, agencyRole: true },
  });
  if (!user) return null;
  if (user.agencyId && (user.agencyRole === "owner" || user.agencyRole === "cm")) {
    return { id: user.id, email: user.email, name: user.name, agencyId: user.agencyId, owner: user.agencyRole === "owner", role: user.agencyRole };
  }
  if (isPlatformAdminEmail(user.email)) {
    return { id: user.id, email: user.email, name: user.name, agencyId: await previewAgencyId(), owner: true, role: "owner" };
  }
  return null;
}

/** La agencia de quien tiene sesión iniciada, o null. */
export async function requireAgency() {
  return agencyUser();
}

/**
 * ¿Esta creadora está en la cartera de esta agencia? Es el único lugar donde vive esa pregunta
 * (la usan requireAgencyAccess y /api/admin/agency/enter) — separado de la sesión para poder
 * probarlo con datos reales sin necesitar una petición HTTP (ver tests/agency-access.test.ts).
 */
export async function agencyOwnsCreator(agencyId: string, creatorId: string) {
  const creator = await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { agencyId: true } });
  return creator?.agencyId === agencyId;
}

/** ¿Esta creadora está en la cartera de la agencia con sesión iniciada? Si sí, devuelve ambos. */
export async function requireAgencyAccess(creatorId: string) {
  const agency = await agencyUser();
  if (!agency) return null;
  return (await agencyOwnsCreator(agency.agencyId, creatorId)) ? agency : null;
}

/** Correos activos del equipo de una agencia (para avisos). */
export async function agencyTeamEmails(agencyId: string) {
  const members = await prismaRoot.adminUser.findMany({ where: { agencyId }, select: { email: true } });
  return members.map((m) => m.email);
}

/** Cuántas creadoras tiene hoy la cartera de una agencia. */
export async function agencyCreatorCount(agencyId: string) {
  return prismaRoot.creator.count({ where: { agencyId } });
}

/** Deja constancia de una acción de la agencia sobre su cartera (agregar, entrar, quitar, roles). */
export async function logAgencyAction(agencyId: string, actorEmail: string, action: string, creatorId: string | null, detail?: string) {
  await prismaRoot.agencyAction
    .create({ data: { agencyId, actorEmail, action, creatorId, detail: detail?.slice(0, 500) } })
    .catch((error) => console.error("No se pudo registrar la acción de la agencia", error));
}
