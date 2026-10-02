import { creatorInfo } from "@/lib/creator-info";

// Datos de la plataforma configurables por variables de entorno, para poder cambiar
// el nombre o el dominio sin tocar código (y, más adelante, la versión por suscripción).
export const siteConfig = {
  /** Nombre comercial de la plataforma (aparece en las páginas legales y en las apps de cada red). */
  platformName: process.env.PLATFORM_NAME || "Portafolio Cristal",
  /** Persona o empresa responsable del servicio y de los datos. */
  legalOwner: process.env.LEGAL_OWNER_NAME || creatorInfo.name,
  /** Correo para consultas de privacidad y solicitudes de borrado de datos. */
  legalEmail: process.env.LEGAL_CONTACT_EMAIL || creatorInfo.email,
  /** Fecha de la última actualización de las páginas legales. */
  legalUpdatedAt: "2026-10-02",
};

export function getPublicAppUrl() {
  return (process.env.APP_URL || "").replace(/\/$/, "");
}
