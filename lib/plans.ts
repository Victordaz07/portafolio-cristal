// Planes de Foliocrew (página de venta y, más adelante, Stripe).
// Los precios no se muestran hasta confirmarlos: FOLIOCREW_SHOW_PRICES=true para mostrarlos.

export interface Plan {
  id: "folio" | "pro" | "crew";
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "folio",
    name: "Folio",
    price: 9,
    tagline: "Para empezar a mostrar tu trabajo",
    features: ["Portafolio bilingüe", "Media kit siempre al día", "Bandeja de mensajes de marcas", "Tu dirección tunombre.foliocrew.pro"],
  },
  {
    id: "pro",
    name: "Folio Pro",
    price: 19,
    tagline: "Para manejar tus marcas como un negocio",
    features: ["Todo lo de Folio", "Tu propio dominio", "CRM de marcas y pagos", "Calendario y captions con IA", "Reportes y mejor horario para publicar", "Redes conectadas"],
    highlight: true,
  },
  {
    id: "crew",
    name: "Crew",
    price: 49,
    tagline: "Para agencias y managers",
    features: ["Todo lo de Folio Pro", "Hasta 5 creadoras", "Reportes para marcas", "Soporte prioritario"],
  },
];

export function showPrices() {
  return process.env.FOLIOCREW_SHOW_PRICES === "true";
}
