export type Locale = "es" | "en";

export const LOCALE_COOKIE = "locale";

const es = {
  nav: { about: "Sobre mí", contenido: "Contenido", why: "Por qué yo", contacto: "Contacto" },
  connect: {
    correo: "Correo",
    whatsapp: "WhatsApp",
    colaboraciones: "Colaboraciones",
    sitioWeb: "Sitio web",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    pinterest: "Pinterest",
  },
  hero: {
    badge: "UGC Creator • Brand Reviews",
    headlinePlain: "Reseñas que",
    headlineEmphasis: "inspiran",
    headlineSuffix: "confianza.",
    description:
      "Creo contenido UGC auténtico y reseñas honestas que conectan marcas con personas de verdad.",
    ctaPrimary: "Ver portafolio",
    ctaSecondary: "Trabajemos juntas",
  },
  contenido: { heading: "Contenido" },
  marcas: { eyebrow: "Marcas y colaboraciones" },
  resenas: {
    eyebrow: "Reseñas recientes",
    headingPlain: "Reseñas ",
    headingEmphasis: "destacadas",
    intro: "Contenido honesto, detallado y pensado para ayudarte a tomar mejores decisiones.",
  },
  servicios: { eyebrow: "Lo que hago", headingPlain: "Cómo trabajo ", headingEmphasis: "contigo" },
  paquetes: {
    eyebrow: "Paquetes",
    headingPlain: "Elige lo que ",
    headingEmphasis: "necesitas",
    intro: "Trabajar conmigo es muy fácil: elige el paquete que mejor se ajuste a lo que tu marca necesita.",
  },
  testimonios: {
    eyebrow: "Lo que dicen las marcas",
    headingPlain: "Resultados que ",
    headingEmphasis: "hablan",
    headingSuffix: " por sí solos",
  },
  whyMe: {
    eyebrow: "Por qué trabajar conmigo",
    headingPlain: "Contenido real que ",
    headingEmphasis: "conecta y convierte",
    fallback:
      "No vendo humo: cada video que grabo es contenido real, pensado para conectar y convertir. Cuido cada detalle —guion, luz, edición— como si fuera para mi propia marca, cumplo los plazos que prometo y mantengo una comunicación clara en cada etapa. Cuando trabajas conmigo, tu marca no es un cliente más: es una colaboración de la que ambas salimos ganando.",
  },
  faq: {
    eyebrow: "Preguntas frecuentes",
    headingPlain: "¿Tienes ",
    headingEmphasis: "dudas?",
    intro: "Esto es lo que más me preguntan las marcas antes de trabajar juntas.",
  },
  contacto: {
    headingPrefix: "Conéctate con ",
    footerFallback:
      "Gracias por ser parte de este espacio. Me encanta compartir contigo lo que uso, me funciona y puede hacer tu vida más fácil y bonita.",
    photoAlt: (name: string) => `${name} preparando un envío para su comunidad`,
    hablamos: "¿Hablamos?",
    sigueme: "Sígueme",
    apoyoTitle: "Tu apoyo significa todo",
    apoyoFallback:
      "Cada like, comentario y compartida me ayuda a seguir creando contenido que te sirve. ¡Gracias, de corazón!",
  },
  contactForm: {
    badge: "Escríbeme",
    nombre: "Nombre",
    marca: "Marca / empresa",
    email: "Email",
    tipo: "Tipo de colaboración",
    mensaje: "Mensaje",
    enviar: "Enviar mensaje",
    enviando: "Enviando...",
    successTitle: "¡Gracias por escribir!",
    successBody: "Recibí tu mensaje y te voy a responder por correo lo antes posible.",
    errorFallback: "No se pudo enviar el mensaje, intenta de nuevo.",
  },
  feed: { todos: "Todos", fotos: "Fotos" },
  mobileNav: { openMenu: "Abrir menú", closeMenu: "Cerrar menú" },
  localeToggle: { label: "EN", switchTo: "Ver en inglés" },
};

const en: typeof es = {
  nav: { about: "About me", contenido: "Content", why: "Why me?", contacto: "Contact" },
  connect: {
    correo: "Email",
    whatsapp: "WhatsApp",
    colaboraciones: "Collabs",
    sitioWeb: "Website",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    pinterest: "Pinterest",
  },
  hero: {
    badge: "UGC Creator • Brand Reviews",
    headlinePlain: "Reviews that",
    headlineEmphasis: "inspire",
    headlineSuffix: "trust.",
    description:
      "I create authentic UGC content and honest reviews that connect brands with real people.",
    ctaPrimary: "View portfolio",
    ctaSecondary: "Let's work together",
  },
  contenido: { heading: "Content" },
  marcas: { eyebrow: "Brands & collaborations" },
  resenas: {
    eyebrow: "Recent reviews",
    headingPlain: "Featured ",
    headingEmphasis: "reviews",
    intro: "Honest, detailed content designed to help you make better decisions.",
  },
  servicios: { eyebrow: "What I do", headingPlain: "How I work ", headingEmphasis: "with you" },
  paquetes: {
    eyebrow: "Packages",
    headingPlain: "Choose what ",
    headingEmphasis: "you need",
    intro: "Working with me is easy: choose the package that best fits what your brand needs.",
  },
  testimonios: {
    eyebrow: "What brands say",
    headingPlain: "Results that ",
    headingEmphasis: "speak",
    headingSuffix: " for themselves",
  },
  whyMe: {
    eyebrow: "Why work with me",
    headingPlain: "Real content that ",
    headingEmphasis: "connects and converts",
    fallback:
      "No smoke and mirrors: every video I shoot is real content, made to connect and convert. I care about every detail —script, lighting, editing— as if it were for my own brand, I meet the deadlines I promise, and I keep clear communication at every stage. When you work with me, your brand isn't just another client: it's a collaboration we both win from.",
  },
  faq: {
    eyebrow: "Frequently asked questions",
    headingPlain: "Got ",
    headingEmphasis: "questions?",
    intro: "This is what brands ask me most before working together.",
  },
  contacto: {
    headingPrefix: "Connect with ",
    footerFallback:
      "Thanks for being part of this space. I love sharing what I use, what works for me, and what can make your life easier and more beautiful.",
    photoAlt: (name: string) => `${name} preparing a shipment for her community`,
    hablamos: "Let's talk?",
    sigueme: "Follow me",
    apoyoTitle: "Your support means everything",
    apoyoFallback:
      "Every like, comment, and share helps me keep creating content that's useful to you. Thank you, from the heart!",
  },
  contactForm: {
    badge: "Message me",
    nombre: "Name",
    marca: "Brand / company",
    email: "Email",
    tipo: "Collaboration type",
    mensaje: "Message",
    enviar: "Send message",
    enviando: "Sending...",
    successTitle: "Thanks for reaching out!",
    successBody: "I received your message and will reply by email as soon as possible.",
    errorFallback: "Couldn't send the message, please try again.",
  },
  feed: { todos: "All", fotos: "Photos" },
  mobileNav: { openMenu: "Open menu", closeMenu: "Close menu" },
  localeToggle: { label: "ES", switchTo: "View in Spanish" },
};

const dictionaries: Record<Locale, typeof es> = { es, en };

export function t(locale: Locale) {
  return dictionaries[locale];
}

export function pick(locale: Locale, esValue: string, enValue?: string | null): string {
  if (locale === "en" && enValue) return enValue;
  return esValue;
}

export function pickArray(locale: Locale, esValue: string[], enValue?: string[] | null): string[] {
  if (locale === "en" && enValue && enValue.length > 0) return enValue;
  return esValue;
}
