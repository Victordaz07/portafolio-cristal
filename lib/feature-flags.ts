// Lanzamiento gradual de funciones nuevas: primero solo para embajadoras/es (Creator.ambassador,
// lib/ambassadors.ts), después para todas las cuentas cuando ya estén probadas con gente real.
// Quien administra Foliocrew (lib/platform-admin.ts) siempre las ve, para poder probarlas.
//
// Para abrir una función a todas las cuentas, basta con pasar su `stage` a "everyone" acá —
// no hace falta tocar el menú ni las páginas que ya usan requireFeature() (lib/feature-flags-server.ts).
//
// Archivo sin dependencias de servidor: se usa también en el menú del panel (componente de cliente).

export type FeatureFlag =
  | "comunidad" // Muro, Buscar creadores, Círculos, Sesiones, Mensajes, Conexiones, Mi perfil
  | "acuerdos"
  | "facturas"
  | "tienda"
  | "ingresos"
  | "comentarioDm"
  | "resenasMarcas"
  | "campanas" // Reportes a marcas
  | "reciclar" // Reciclar con IA
  | "bienestar"
  | "notificaciones"; // Avisos en el celular (push)

export const FEATURE_FLAGS: Record<FeatureFlag, { stage: "ambassadors" | "everyone" }> = {
  comunidad: { stage: "ambassadors" },
  acuerdos: { stage: "ambassadors" },
  facturas: { stage: "ambassadors" },
  tienda: { stage: "ambassadors" },
  ingresos: { stage: "ambassadors" },
  comentarioDm: { stage: "ambassadors" },
  resenasMarcas: { stage: "ambassadors" },
  campanas: { stage: "ambassadors" },
  reciclar: { stage: "ambassadors" },
  bienestar: { stage: "ambassadors" },
  notificaciones: { stage: "ambassadors" },
};

export function hasFeature(flag: FeatureFlag, { ambassador, platformAdmin }: { ambassador: boolean; platformAdmin: boolean }): boolean {
  if (platformAdmin) return true;
  if (FEATURE_FLAGS[flag].stage === "everyone") return true;
  return ambassador;
}

/** Prefijo de URL del panel → bandera. Usado para filtrar el menú (AdminShell) y el buscador. */
export const FLAGGED_NAV_PREFIXES: [string, FeatureFlag][] = [
  ["/admin/comunidad", "comunidad"],
  ["/admin/contratos", "acuerdos"],
  ["/admin/facturas", "facturas"],
  ["/admin/tienda", "tienda"],
  ["/admin/ingresos", "ingresos"],
  ["/admin/comentario-dm", "comentarioDm"],
  ["/admin/resenas-marcas", "resenasMarcas"],
  ["/admin/campanas", "campanas"],
  ["/admin/reciclar", "reciclar"],
  ["/admin/bienestar", "bienestar"],
  ["/admin/notificaciones", "notificaciones"],
];

export function navFlagFor(href: string): FeatureFlag | null {
  return FLAGGED_NAV_PREFIXES.find(([prefix]) => href.startsWith(prefix))?.[1] ?? null;
}
