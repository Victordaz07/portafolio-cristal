// Plantillas del asistente de bienvenida: con el nicho y el nombre de la creadora se arma
// un sitio completo (portada, bio, servicios, paquetes y preguntas frecuentes) en español e
// inglés, que después puede editar todo desde el panel.

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
export function suggestedBio(niche: Niche, firstName: string) {
  return {
    es: `Hola, soy ${firstName}. Creo contenido UGC de ${niche.product} para marcas que quieren conectar con su audiencia de forma auténtica.`,
    en: `Hi, I'm ${firstName}. I create UGC content about ${niche.productEn} for brands that want to connect with their audience authentically.`,
  };
}

export function siteTemplate(niche: Niche) {
  return {
    hero: {
      niche: niche.label,
      nicheEn: niche.labelEn,
      badgeLabel: `Contenido UGC • ${niche.label}`,
      badgeLabelEn: `UGC Creator • ${niche.labelEn}`,
      headlinePlain: niche.headline[0],
      headlineEmphasis: niche.headline[1],
      headlineSuffix: niche.headline[2],
      headlinePlainEn: niche.headlineEn[0],
      headlineEmphasisEn: niche.headlineEn[1],
      headlineSuffixEn: niche.headlineEn[2],
    },
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
      { question: "¿Cuánto tardas en entregar?", questionEn: "How long does delivery take?", answer: "Normalmente entre 5 y 10 días después de recibir el producto, según el paquete.", answerEn: "Usually 5 to 10 days after receiving the product, depending on the package." },
      { question: "¿Puedo usar el contenido en anuncios?", questionEn: "Can I use the content in ads?", answer: "Sí. Cada paquete incluye derechos de uso; para anuncios pagados acordamos el plazo en la propuesta.", answerEn: "Yes. Every package includes usage rights; for paid ads we agree on the usage period in the proposal." },
      { question: "¿Cómo empezamos?", questionEn: "How do we start?", answer: "Escríbeme desde el formulario de contacto con tu marca, el producto y lo que buscas, y te envío una propuesta.", answerEn: "Write to me through the contact form with your brand, the product and what you're looking for, and I'll send you a proposal." },
    ],
  };
}
