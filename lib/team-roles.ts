// Roles del equipo de Foliocrew (sin dependencias de servidor: se usan también en el navegador).

export const TEAM_ROLES = [
  {
    id: "support",
    label: "Soporte",
    hint: "Atiende los tickets de las cuentas y puede entrar a una cuenta para ayudar (con motivo, queda registrado).",
  },
  {
    id: "growth",
    label: "Mejora continua",
    hint: "Gestiona las sugerencias de las cuentas y las ideas del equipo.",
  },
  {
    id: "data",
    label: "Datos y recuperación",
    hint: "Exporta datos de una cuenta y atiende pedidos de copia, recuperación o borrado.",
  },
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number]["id"];

const ROLE_IDS = TEAM_ROLES.map((r) => r.id) as readonly string[];

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && ROLE_IDS.includes(value);
}

export function roleLabel(role: string) {
  return TEAM_ROLES.find((r) => r.id === role)?.label ?? role;
}
