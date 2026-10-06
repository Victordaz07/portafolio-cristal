// Planes de Foliocrew (página de venta y, más adelante, Stripe).
// Los precios no se muestran hasta confirmarlos: FOLIOCREW_SHOW_PRICES=true para mostrarlos.

export interface Plan {
  id: "folio" | "pro" | "crew";
  name: string;
  price: number;
  tagline: string;
  taglineEn: string;
  features: string[];
  featuresEn: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "folio",
    name: "Folio",
    price: 9,
    tagline: "Para empezar a mostrar tu trabajo",
    taglineEn: "To start showing your work",
    features: ["Portafolio bilingüe", "Media kit siempre al día", "Bandeja de mensajes de marcas", "Tu dirección tunombre.foliocrew.pro"],
    featuresEn: ["Bilingual portfolio", "Always up-to-date media kit", "Brand message inbox", "Your address yourname.foliocrew.pro"],
  },
  {
    id: "pro",
    name: "Folio Pro",
    price: 19,
    tagline: "Para manejar tus marcas como un negocio",
    taglineEn: "To manage your brands like a business",
    features: ["Todo lo de Folio", "Tu propio dominio", "CRM de marcas y pagos", "Calendario y captions con IA", "Reportes y mejor horario para publicar", "Redes conectadas"],
    featuresEn: ["Everything in Folio", "Your own domain", "Brand & payments CRM", "Calendar and AI captions", "Reports and best time to post", "Connected social accounts"],
    highlight: true,
  },
  {
    id: "crew",
    name: "Crew",
    price: 49,
    tagline: "Para agencias y managers",
    taglineEn: "For agencies and managers",
    features: ["Todo lo de Folio Pro", "Hasta 5 perfiles de creador", "Reportes para marcas", "Soporte prioritario"],
    featuresEn: ["Everything in Folio Pro", "Up to 5 creator profiles", "Reports for brands", "Priority support"],
  },
];

export function showPrices() {
  return process.env.FOLIOCREW_SHOW_PRICES === "true";
}
