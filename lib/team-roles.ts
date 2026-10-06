// Roles del equipo de Foliocrew (sin dependencias de servidor: se usan también en el navegador).

export const TEAM_ROLES = [
  {
    id: "support",
    label: "Centro de ayuda",
    labelEn: "Help center",
    hintEn: "Handles account tickets and can sign in to an account to help (with a reason, it's logged).",
    hint: "Atiende los tickets de las cuentas y puede entrar a una cuenta para ayudar (con motivo, queda registrado).",
  },
  {
    id: "growth",
    label: "Centro de sugerencias",
    labelEn: "Suggestions center",
    hintEn: "Manages account suggestions and team ideas.",
    hint: "Gestiona las sugerencias de las cuentas y las ideas del equipo.",
  },
  {
    id: "data",
    label: "Recuperación de datos",
    labelEn: "Data recovery",
    hintEn: "Exports an account's data and handles copy, recovery or deletion requests.",
    hint: "Exporta datos de una cuenta y atiende pedidos de copia, recuperación o borrado.",
  },
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number]["id"];

const ROLE_IDS = TEAM_ROLES.map((r) => r.id) as readonly string[];

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && ROLE_IDS.includes(value);
}

export function roleLabel(role: string, lang: "es" | "en" = "es") {
  const found = TEAM_ROLES.find((r) => r.id === role);
  if (!found) return role;
  return lang === "en" ? found.labelEn : found.label;
}
