// Plantillas del asistente de bienvenida: con el nicho, el nombre y el tipo de creador
// (contenido, UGC o ambos) se arma un sitio completo (portada, bio, servicios, paquetes y
// preguntas frecuentes) en español e inglés, que después se puede editar todo desde el panel.

import type { CreatorKind } from "./creator-kind";

export interface Niche {
  id: string;
  label: string;
  labelEn: string;
  /** "maquillaje", "productos para el hogar"… (se usa en los textos). */
  product: string;
  productEn: string;
  headline: [string, string, string];
  headlineEn: [string, string, string];
}

export const NICHES: Niche[] = [
  { id: "belleza", label: "Belleza y maquillaje", labelEn: "Beauty & makeup", product: "maquillaje y belleza", productEn: "makeup and beauty", headline: ["Reseñas que", "inspiran", "confianza."], headlineEn: ["Reviews that", "inspire", "trust."] },
  { id: "skincare", label: "Skincare", labelEn: "Skincare", product: "cuidado de la piel", productEn: "skincare", headline: ["Piel real,", "resultados", "reales."], headlineEn: ["Real skin,", "real", "results."] },
  { id: "moda", label: "Moda", labelEn: "Fashion", product: "ropa y accesorios", productEn: "clothing and accessories", headline: ["Estilo que", "vende", "solo."], headlineEn: ["Style that", "sells", "itself."] },
  { id: "lifestyle", label: "Lifestyle", labelEn: "Lifestyle", product: "productos para el día a día", productEn: "everyday products", headline: ["Contenido que", "conecta", "con tu marca."], headlineEn: ["Content that", "connects", "with your brand."] },
  { id: "fitness", label: "Fitness y bienestar", labelEn: "Fitness & wellness", product: "bienestar y fitness", productEn: "wellness and fitness", headline: ["Contenido que", "mueve", "a tu audiencia."], headlineEn: ["Content that", "moves", "your audience."] },
  { id: "comida", label: "Comida y bebidas", labelEn: "Food & drinks", product: "comida y bebidas", productEn: "food and drinks", headline: ["Contenido que", "abre", "el apetito."], headlineEn: ["Content that", "sparks", "appetite."] },
  { id: "familia", label: "Mamá y familia", labelEn: "Mom & family", product: "productos para la familia", productEn: "family products", headline: ["Contenido real para", "familias", "reales."], headlineEn: ["Real content for", "real", "families."] },
  { id: "hogar", label: "Hogar y decoración", labelEn: "Home & decor", product: "productos para el hogar", productEn: "home products", headline: ["Tu marca,", "en casa", "de tu cliente."], headlineEn: ["Your brand,", "at home", "with your customer."] },
  { id: "tecnologia", label: "Tecnología", labelEn: "Tech", product: "tecnología y gadgets", productEn: "tech and gadgets", headline: ["Tecnología", "explicada", "con naturalidad."], headlineEn: ["Tech,", "explained", "naturally."] },
  { id: "viajes", label: "Viajes", labelEn: "Travel", product: "viajes y experiencias", productEn: "travel and experiences", headline: ["Experiencias que", "dan ganas", "de vivir."], headlineEn: ["Experiences people", "want", "to live."] },
  { id: "mascotas", label: "Mascotas", labelEn: "Pets", product: "productos para mascotas", productEn: "pet products", headline: ["Contenido que", "enamora", "a sus dueños."], headlineEn: ["Content pet", "parents", "love."] },
  { id: "otro", label: "Varios temas", labelEn: "Various topics", product: "productos", productEn: "products", headline: ["Contenido que", "conecta", "con tu marca."], headlineEn: ["Content that", "connects", "with your brand."] },
];

export function getNiche(id: string) {
  return NICHES.find((n) => n.id === id) ?? NICHES[NICHES.length - 1];
}

/** Bio sugerida (editable en el asistente). */
export function suggestedBio(niche: Niche, firstName: string, kind: CreatorKind = "contenido") {
  if (kind === "ugc") {
    return {
      es: `Hola, soy ${firstName}. Creo contenido UGC de ${niche.product} para marcas que quieren conectar con su audiencia de forma auténtica.`,
      en: `Hi, I'm ${firstName}. I create UGC content about ${niche.productEn} for brands that want to connect with their audience authentically.`,
    };
  }
  if (kind === "ambos") {
    return {
      es: `Hola, soy ${firstName}. Creo contenido de ${niche.product} para mi comunidad y también contenido UGC para que las marcas lo usen en sus redes y anuncios.`,
      en: `Hi, I'm ${firstName}. I create ${niche.productEn} content for my community, plus UGC that brands can use on their own social media and ads.`,
    };
  }
  return {
    es: `Hola, soy ${firstName}. Comparto contenido de ${niche.product} con una comunidad que confía en mis recomendaciones, y colaboro con marcas que encajan con ella.`,
    en: `Hi, I'm ${firstName}. I share ${niche.productEn} content with a community that trusts my recommendations, and I partner with brands that fit it.`,
  };
}

const BADGE: Record<CreatorKind, [string, string]> = {
  contenido: ["Creación de contenido", "Content Creator"],
  ugc: ["Contenido UGC", "UGC Creator"],
  ambos: ["Contenido y UGC", "Content & UGC Creator"],
};

const DELIVERY_FAQ = {
  question: "¿Cuánto tardas en entregar?",
  questionEn: "How long does delivery take?",
  answer: "Normalmente entre 5 y 10 días después de recibir el producto, según el paquete.",
  answerEn: "Usually 5 to 10 days after receiving the product, depending on the package.",
};
const START_FAQ = {
  question: "¿Cómo empezamos?",
  questionEn: "How do we start?",
  answer: "Escríbeme desde el formulario de contacto con tu marca, el producto y lo que buscas, y te envío una propuesta.",
  answerEn: "Write to me through the contact form with your brand, the product and what you're looking for, and I'll send you a proposal.",
};

function ugcBlocks(niche: Niche) {
  return {
    whyMe: {
      es: `Creo contenido de ${niche.product} que se siente real para tu audiencia: videos que la gente ve hasta el final, entregas puntuales y comunicación clara en todo el proceso.`,
      en: `I create ${niche.productEn} content that feels real to your audience: videos people watch to the end, on-time delivery and clear communication throughout.`,
    },
    services: [
      { icon: "camera", title: "Videos UGC", titleEn: "UGC videos", description: `Videos verticales auténticos para tus redes y anuncios, mostrando ${niche.product} como lo usaría tu cliente.`, descriptionEn: `Authentic vertical videos for your social media and ads, showing ${niche.productEn} the way your customer would use them.` },
      { icon: "chat", title: "Reseñas honestas", titleEn: "Honest reviews", description: "Cuento mi experiencia real con tu producto: qué me gustó, cómo se usa y para quién es.", descriptionEn: "I share my real experience with your product: what I liked, how to use it and who it's for." },
      { icon: "box", title: "Unboxing y primeras impresiones", titleEn: "Unboxing & first impressions", description: "Abro tu paquete frente a la cámara y muestro el producto desde el primer momento.", descriptionEn: "I open your package on camera and show the product from the very first moment." },
      { icon: "phone", title: "Fotos para redes", titleEn: "Social media photos", description: "Fotos con luz natural listas para tu feed, tu web o tus anuncios.", descriptionEn: "Natural-light photos ready for your feed, website or ads." },
    ],
    packages: [
      { emoji: "✨", name: "Básico", nameEn: "Starter", items: ["1 video UGC de 15–30 s", "1 ronda de cambios", "Derechos de uso en redes"], itemsEn: ["1 UGC video (15–30 s)", "1 round of revisions", "Organic usage rights"] },
      { emoji: "🚀", name: "Crecimiento", nameEn: "Growth", items: ["3 videos UGC", "3 fotos de producto", "2 rondas de cambios", "Ganchos alternativos para anuncios"], itemsEn: ["3 UGC videos", "3 product photos", "2 rounds of revisions", "Alternative hooks for ads"] },
      { emoji: "💜", name: "Mensual", nameEn: "Monthly", items: ["4 videos UGC al mes", "Fotos de producto", "Plan de contenido", "Prioridad en entregas"], itemsEn: ["4 UGC videos per month", "Product photos", "Content plan", "Priority delivery"] },
    ],
    faq: [
      { question: "¿Necesito que tengas muchos seguidores?", questionEn: "Do you need a lot of followers?", answer: "No. El contenido UGC es para que tu marca lo publique en sus redes y anuncios: lo que importa es la calidad y la autenticidad del video.", answerEn: "No. UGC is content your brand posts on its own social media and ads: what matters is the quality and authenticity of the video." },
      DELIVERY_FAQ,
      { question: "¿Puedo usar el contenido en anuncios?", questionEn: "Can I use the content in ads?", answer: "Sí. Cada paquete incluye derechos de uso; para anuncios pagados acordamos el plazo en la propuesta.", answerEn: "Yes. Every package includes usage rights; for paid ads we agree on the usage period in the proposal." },
      START_FAQ,
    ],
  };
}

function contentBlocks(niche: Niche) {
  return {
    whyMe: {
      es: `Mi comunidad me sigue por ${niche.product}: le hablo con honestidad, así que cuando recomiendo algo, lo prueba. Integro tu marca de forma natural, entrego a tiempo y te comparto los resultados.`,
      en: `My community follows me for ${niche.productEn}: I'm honest with them, so when I recommend something, they try it. I feature your brand naturally, deliver on time and share the results with you.`,
    },
    services: [
      { icon: "camera", title: "Publicaciones patrocinadas", titleEn: "Sponsored posts", description: `Reels y TikToks en mis redes presentando tu marca de ${niche.product} a mi comunidad, con mi estilo.`, descriptionEn: `Reels and TikToks on my channels introducing your ${niche.productEn} brand to my community, in my own style.` },
      { icon: "phone", title: "Historias con enlace", titleEn: "Stories with link", description: "Historias con tu enlace o código de descuento para llevar a mi audiencia directo a tu tienda.", descriptionEn: "Stories with your link or discount code to send my audience straight to your store." },
      { icon: "chat", title: "Reseñas honestas", titleEn: "Honest reviews", description: "Cuento mi experiencia real con tu producto: qué me gustó, cómo se usa y para quién es.", descriptionEn: "I share my real experience with your product: what I liked, how to use it and who it's for." },
      { icon: "box", title: "Alianzas de largo plazo", titleEn: "Long-term partnerships", description: "Colaboraciones de varios meses para que mi comunidad conozca y recuerde tu marca.", descriptionEn: "Multi-month collaborations so my community gets to know and remember your brand." },
    ],
    packages: [
      { emoji: "✨", name: "Básico", nameEn: "Starter", items: ["1 Reel o TikTok en mis redes", "3 historias con tu enlace", "Reporte de resultados"], itemsEn: ["1 Reel or TikTok on my channels", "3 stories with your link", "Results report"] },
      { emoji: "🚀", name: "Crecimiento", nameEn: "Growth", items: ["2 publicaciones en mis redes", "Historias con enlace y código de descuento", "Reporte con alcance y clics"], itemsEn: ["2 posts on my channels", "Stories with link and discount code", "Report with reach and clicks"] },
      { emoji: "💜", name: "Alianza mensual", nameEn: "Monthly partnership", items: ["4 publicaciones al mes", "Historias semanales", "Exclusividad en tu categoría", "Reporte mensual"], itemsEn: ["4 posts per month", "Weekly stories", "Category exclusivity", "Monthly report"] },
    ],
    faq: [
      { question: "¿Cuánta gente ve tus publicaciones?", questionEn: "How many people see your posts?", answer: "En mi media kit están mis seguidores, alcance y engagement actualizados. Si quieres datos de una red en particular, pídemelos.", answerEn: "My media kit has my up-to-date followers, reach and engagement. If you'd like stats for a specific platform, just ask." },
      DELIVERY_FAQ,
      { question: "¿Puedo usar el contenido en mis anuncios?", questionEn: "Can I use the content in my ads?", answer: "Sí. Los derechos de uso para tus redes o anuncios se suman a la propuesta, con el plazo que acordemos.", answerEn: "Yes. Usage rights for your channels or ads are added to the proposal, for the period we agree on." },
      START_FAQ,
    ],
  };
}

function bothBlocks(niche: Niche) {
  const content = contentBlocks(niche);
  const ugc = ugcBlocks(niche);
  return {
    whyMe: {
      es: `Tengo una comunidad que confía en mis recomendaciones de ${niche.product} y también sé crear contenido para que tu marca lo publique: publico en mis redes, te entrego videos listos para tus anuncios y te comparto los resultados.`,
      en: `I have a community that trusts my ${niche.productEn} recommendations, and I also create content for your brand to post: I publish on my channels, deliver ad-ready videos and share the results with you.`,
    },
    services: [content.services[0], ugc.services[0], content.services[1], content.services[2]],
    packages: [
      ugc.packages[0],
      { emoji: "🚀", name: "Combo", nameEn: "Combo", items: ["1 Reel o TikTok en mis redes", "2 videos UGC para tus anuncios", "Historias con tu enlace", "Reporte de resultados"], itemsEn: ["1 Reel or TikTok on my channels", "2 UGC videos for your ads", "Stories with your link", "Results report"] },
      content.packages[2],
    ],
    faq: [content.faq[0], DELIVERY_FAQ, ugc.faq[2], START_FAQ],
  };
}

export function siteTemplate(niche: Niche, kind: CreatorKind = "contenido") {
  const blocks = kind === "ugc" ? ugcBlocks(niche) : kind === "ambos" ? bothBlocks(niche) : contentBlocks(niche);
  const [badge, badgeEn] = BADGE[kind];
  return {
    hero: {
      niche: niche.label,
      nicheEn: niche.labelEn,
      badgeLabel: `${badge} • ${niche.label}`,
      badgeLabelEn: `${badgeEn} • ${niche.labelEn}`,
      headlinePlain: niche.headline[0],
      headlineEmphasis: niche.headline[1],
      headlineSuffix: niche.headline[2],
      headlinePlainEn: niche.headlineEn[0],
      headlineEmphasisEn: niche.headlineEn[1],
      headlineSuffixEn: niche.headlineEn[2],
    },
    ...blocks,
  };
}
