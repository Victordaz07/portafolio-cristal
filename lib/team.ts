import { prismaRoot } from "./prisma-root";
import { getSession } from "./tenant";
import { adminEmails, isPlatformAdminEmail } from "./platform-admin";

// Equipo de Foliocrew. Quien está en PLATFORM_ADMIN_EMAILS es Dueño (puede todo, también sumar
// personas al equipo). Las demás personas se agregan en Equipo → Personas, con uno o más roles.
// Cada una entra con su propia cuenta de Foliocrew; el rol decide qué centros ve.

export { TEAM_ROLES, isTeamRole, roleLabel, type TeamRole } from "./team-roles";
import { TEAM_ROLES, isTeamRole, type TeamRole } from "./team-roles";

export interface TeamUser {
  id: string;
  email: string;
  name: string | null;
  creatorId: string;
  /** Dueño de Foliocrew: tiene todos los roles y administra el equipo. */
  owner: boolean;
  roles: TeamRole[];
}

/** Rol del equipo para un correo: "owner", la lista de roles, o null si no es del equipo. */
export async function teamRolesFor(email: string): Promise<{ owner: boolean; roles: TeamRole[] } | null> {
  const lower = email.toLowerCase();
  if (isPlatformAdminEmail(lower)) return { owner: true, roles: TEAM_ROLES.map((r) => r.id) };
  const member = await prismaRoot.teamMember.findUnique({ where: { email: lower } });
  if (!member?.active) return null;
  const roles = member.roles.filter(isTeamRole);
  return roles.length ? { owner: false, roles } : null;
}

/**
 * La persona del equipo con sesión iniciada (null si no es del equipo). No cuenta mientras está
 * "entrando como" otra cuenta: ahí ve el panel de esa cuenta, no los centros del equipo.
 */
export async function teamUser(): Promise<TeamUser | null> {
  const session = await getSession();
  if (!session || session.actorId) return null;
  const user = await prismaRoot.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, creatorId: true },
  });
  if (!user) return null;
  const access = await teamRolesFor(user.email);
  return access ? { ...user, ...access } : null;
}

export function hasRole(user: TeamUser | null, role: TeamRole): user is TeamUser {
  return Boolean(user && (user.owner || user.roles.includes(role)));
}

/** La persona del equipo si tiene ese rol (o es Dueño); si no, null. */
export async function requireRole(role: TeamRole) {
  const user = await teamUser();
  return hasRole(user, role) ? user : null;
}

/** Solo el Dueño. */
export async function requireOwner() {
  const user = await teamUser();
  return user?.owner ? user : null;
}

/** Correos a los que avisar de algo de un centro: Dueños + personas activas con ese rol. */
export async function teamEmailsWith(role: TeamRole) {
  const members = await prismaRoot.teamMember.findMany({
    where: { active: true, roles: { has: role } },
    select: { email: true },
  });
  return Array.from(new Set([...adminEmails(), ...members.map((m) => m.email)]));
}

/** Nombre para mostrar de alguien del equipo. */
export function teamDisplayName(user: { name: string | null; email: string }) {
  return user.name?.trim() || user.email.split("@")[0];
}
