import type { PrismaClient } from "@prisma/client";

export async function seedDatabase(prisma: PrismaClient) {
  await prisma.hero.deleteMany();
  await prisma.hero.create({
    data: {
      name: "Cristal Amalia Flores Bello",
      location: "Santo Domingo, DR",
      niche: "UGC Creator",
      nicheEn: "UGC Creator",
      badgeLabel: "UGC Creator • Brand Reviews",
      badgeLabelEn: "UGC Creator • Brand Reviews",
      headlinePlain: "Reseñas que",
      headlinePlainEn: "Reviews that",
      headlineEmphasis: "inspiran",
      headlineEmphasisEn: "inspire",
      headlineSuffix: "confianza.",
      headlineSuffixEn: "trust.",
      description:
        "Creo contenido UGC auténtico y reseñas honestas que conectan marcas con personas de verdad.",
      descriptionEn:
        "I create authentic UGC content and honest reviews that connect brands with real people.",
      photoUrl: "/images/hero-placeholder.png",
      photoUrlMobile: "/images/hero-placeholder-mobile.png",
      ctaPrimaryLabel: "Ver portafolio",
      ctaPrimaryLabelEn: "View portfolio",
      ctaPrimaryHref: "#contenido",
      ctaSecondaryLabel: "Trabajemos juntas",
      ctaSecondaryLabelEn: "Let's work together",
      ctaSecondaryHref: "#contacto",
    },
  });

  await prisma.stat.deleteMany();
  await prisma.stat.createMany({
    data: [
      { label: "Audiencia", labelEn: "Audience", value: "50K+", icon: "heart", order: 0 },
      { label: "Colaboraciones", labelEn: "Collaborations", value: "120+", icon: "people", order: 1 },
      { label: "Valoración", labelEn: "Rating", value: "4.9", icon: "star", order: 2 },
    ],
  });

  await prisma.contentCard.deleteMany();
  await prisma.contentCard.createMany({
    data: [
      {
        type: "video",
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/@crislia.24/video/0000000000000000001",
        caption: "Mi rutina de skincare de las mañanas",
        captionEn: "My morning skincare routine",
        category: "Maquillaje y cuidado de la piel",
        categoryEn: "Makeup & Skincare",
        statPrimary: "120K vistas",
        statPrimaryEn: "120K views",
        statSecondary: "9.4% ER",
        statSecondaryEn: "9.4% ER",
        order: 0,
      },
      {
        type: "video",
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/@crislia.24/video/0000000000000000002",
        caption: "Probando el sérum que todas piden",
        captionEn: "Trying the serum everyone's asking about",
        category: "Maquillaje y cuidado de la piel",
        categoryEn: "Makeup & Skincare",
        statPrimary: "88K vistas",
        statPrimaryEn: "88K views",
        statSecondary: "7.1% ER",
        statSecondaryEn: "7.1% ER",
        order: 1,
      },
      {
        type: "video",
        platform: "instagram",
        postUrl: "https://www.instagram.com/reel/C0000000001/",
        caption: "Transformación de cabello con Dear Hair",
        captionEn: "Hair transformation with Dear Hair",
        category: "Cabello",
        categoryEn: "Hair",
        statPrimary: "64K vistas",
        statPrimaryEn: "64K views",
        statSecondary: "6.8% ER",
        statSecondaryEn: "6.8% ER",
        order: 2,
      },
      {
        type: "photo",
        platform: "instagram",
        postUrl: "https://www.instagram.com/p/C0000000002/",
        caption: "Look del día con productos Charlotte Tilbury",
        captionEn: "Get-ready-with-me with Charlotte Tilbury products",
        category: "Maquillaje y cuidado de la piel",
        categoryEn: "Makeup & Skincare",
        statPrimary: "3.2K me gusta",
        statPrimaryEn: "3.2K likes",
        statSecondary: "410 guardados",
        statSecondaryEn: "410 saves",
        order: 3,
      },
      {
        type: "photo",
        platform: "instagram",
        postUrl: "https://www.instagram.com/p/C0000000003/",
        caption: "Mi último libro leído — reseña sin spoilers",
        captionEn: "My latest read — spoiler-free review",
        category: "Libros",
        categoryEn: "Books",
        statPrimary: "2.1K me gusta",
        statPrimaryEn: "2.1K likes",
        statSecondary: "560 guardados",
        statSecondaryEn: "560 saves",
        order: 4,
      },
      {
        type: "video",
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/@crislia.24/video/0000000000000000003",
        caption: "Un domingo tranquilo con té y libros",
        captionEn: "A quiet Sunday with tea and books",
        category: "Estilo de vida",
        categoryEn: "Lifestyle",
        statPrimary: "51K vistas",
        statPrimaryEn: "51K views",
        statSecondary: "8.9% ER",
        statSecondaryEn: "8.9% ER",
        order: 5,
      },
    ],
  });

  await prisma.brand.deleteMany();
  await prisma.brand.createMany({
    data: [
      { name: "Aromatica", logoUrl: "/images/brands/aromatica.png", order: 0 },
      { name: "Dear Hair", logoUrl: "/images/brands/dear-hair.png", order: 1 },
      { name: "Ymak", logoUrl: "/images/brands/ymak.png", order: 2 },
      { name: "Mary & May", logoUrl: "/images/brands/mary-and-may.jpg", order: 3 },
      { name: "YesStyle", logoUrl: "/images/brands/yesstyle.png", order: 4 },
      { name: "ivoskin", logoUrl: "/images/brands/ivoskin.png", order: 5 },
      { name: "Gimme Beauty Creator Club", logoUrl: "/images/brands/gimme-beauty.png", order: 6 },
      {
        name: "American Eagle Outfitters",
        logoUrl: "/images/brands/american-eagle.jpg",
        order: 7,
      },
      { name: "GroupSocial", logoUrl: "/images/brands/groupsocial.png", order: 8 },
      { name: "iUNIK", logoUrl: "/images/brands/iunik.png", order: 9 },
      { name: "milli²", logoUrl: "/images/brands/milli2.png", order: 10 },
      { name: "TEMU", logoUrl: "/images/brands/temu.jpg", order: 11 },
      { name: "Juve Look", logoUrl: "/images/brands/juve-look.png", order: 12 },
      { name: "Cushionaire", logoUrl: "/images/brands/cushionaire.jpg", order: 13 },
      { name: "Dr. Different", logoUrl: "/images/brands/dr-different.jpg", order: 14 },
    ],
  });

  await prisma.review.deleteMany();
  await prisma.review.createMany({
    data: [
      {
        category: "Cuidado de la piel",
        categoryEn: "Skincare",
        title: "IUNIK – Sérum de Árbol de Té",
        titleEn: "IUNIK – Tea Tree Serum",
        description: "Calma, hidrata y mejora visiblemente la piel sensible.",
        descriptionEn: "Calms, hydrates, and visibly improves sensitive skin.",
        rating: 5,
        order: 0,
      },
      {
        category: "Belleza",
        categoryEn: "Beauty",
        title: "Cushionaire",
        titleEn: "Cushionaire",
        description: "Cobertura ligera con acabado natural, perfecta para el día a día.",
        descriptionEn: "Lightweight coverage with a natural finish, perfect for everyday wear.",
        rating: 5,
        order: 1,
      },
      {
        category: "Estilo de vida",
        categoryEn: "Lifestyle",
        title: "Mary & May – Mascarilla de Enjuague",
        titleEn: "Mary & May – Wash Off Mask",
        description: "Textura suave que deja la piel fresca sin resecar.",
        descriptionEn: "Soft texture that leaves skin feeling fresh without drying it out.",
        rating: 4,
        order: 2,
      },
    ],
  });

  await prisma.service.deleteMany();
  await prisma.service.createMany({
    data: [
      {
        icon: "camera",
        title: "Contenido UGC",
        titleEn: "UGC Content",
        description: "Videos y fotos auténticas creadas para conectar con tu audiencia.",
        descriptionEn: "Authentic videos and photos created to connect with your audience.",
        order: 0,
      },
      {
        icon: "chat",
        title: "Reseñas honestas",
        titleEn: "Honest Reviews",
        description: "Opiniones reales que generan confianza y aumentan conversiones.",
        descriptionEn: "Real opinions that build trust and boost conversions.",
        order: 1,
      },
      {
        icon: "box",
        title: "Unboxings",
        titleEn: "Unboxings",
        description: "Experiencias de apertura y primeras impresiones que enamoran.",
        descriptionEn: "Unboxing experiences and first impressions people fall in love with.",
        order: 2,
      },
      {
        icon: "camera",
        title: "Fotografía de producto",
        titleEn: "Product Photography",
        description: "Imágenes limpias, estéticas y alineadas con tu identidad de marca.",
        descriptionEn: "Clean, aesthetic images aligned with your brand identity.",
        order: 3,
      },
      {
        icon: "phone",
        title: "Contenido para redes",
        titleEn: "Social Content",
        description: "Reels, TikToks y Shorts optimizados para cada plataforma.",
        descriptionEn: "Reels, TikToks, and Shorts optimized for every platform.",
        order: 4,
      },
    ],
  });

  await prisma.package.deleteMany();
  await prisma.package.createMany({
    data: [
      {
        emoji: "✨",
        name: "Paquete Inicial",
        nameEn: "Starter Package",
        items: [
          "2-3 videos UGC",
          "Demostración de producto",
          "Voz en off o hablando a cámara",
          "Iluminación natural",
          "Formato vertical (9:16)",
          "Edición estilo orgánico",
        ],
        itemsEn: [
          "2-3 UGC videos",
          "Product demonstration",
          "Voiceover or talking to camera",
          "Natural lighting",
          "Vertical format (9:16)",
          "Organic style editing",
        ],
        order: 0,
      },
      {
        emoji: "🚀",
        name: "Paquete de Crecimiento",
        nameEn: "Growth Package",
        items: [
          "5-7 videos UGC",
          "Diferentes ganchos (hooks)",
          "Múltiples llamados a la acción",
          "Tomas de estilo de vida + producto",
          "Metraje B-Roll",
          "Sugerencias de captions",
        ],
        itemsEn: [
          "5-7 UGC videos",
          "Different hooks",
          "Multiple CTAs",
          "Lifestyle + product shots",
          "B-Roll footage",
          "Caption suggestions",
        ],
        order: 1,
      },
      {
        emoji: "💎",
        name: "Paquete Premium de Marca",
        nameEn: "Premium Brand Package",
        items: [
          "10+ videos UGC",
          "Múltiples conceptos",
          "Diferentes ganchos y ángulos",
          "Fotografía de producto",
          "Metraje crudo disponible",
          "Creativos estilo anuncio",
          "Versiones orgánicas y para pauta",
          "Guion incluido",
          "Sugerencias de miniaturas",
        ],
        itemsEn: [
          "10+ UGC videos",
          "Multiple concepts",
          "Different hooks & angles",
          "Product photography",
          "Raw footage available",
          "Ad-style creatives",
          "Organic & paid media versions",
          "Scriptwriting included",
          "Thumbnail suggestions",
        ],
        order: 2,
      },
    ],
  });

  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: [
      {
        quote:
          "Crislia entiende perfectamente nuestra marca y crea contenido que realmente conecta con nuestra audiencia. ¡Un placer trabajar con ella!",
        quoteEn:
          "Crislia perfectly understands our brand and creates content that truly connects with our audience. A pleasure to work with her!",
        name: "María G.",
        role: "Gerente de Marketing – IUNIK",
        roleEn: "Marketing Manager – IUNIK",
        order: 0,
      },
      {
        quote:
          "Sus reseñas son honestas, detalladas y visualmente hermosas. Hemos visto excelente engagement y conversiones.",
        quoteEn:
          "Her reviews are honest, detailed, and visually beautiful. We've seen excellent engagement and conversions.",
        name: "Laura P.",
        role: "Fundadora – Mary & May",
        roleEn: "Founder – Mary & May",
        order: 1,
      },
      {
        quote: "Profesional, creativa y siempre cumple con los tiempos. La recomendamos al 100%.",
        quoteEn: "Professional, creative, and always delivers on time. We recommend her 100%.",
        name: "Javier R.",
        role: "Gerente de Marca – Dr. Different",
        roleEn: "Brand Manager – Dr. Different",
        order: 2,
      },
    ],
  });

  await prisma.faqItem.deleteMany();
  await prisma.faqItem.createMany({
    data: [
      {
        question: "¿Cuál es el tiempo de entrega?",
        questionEn: "What's the turnaround time?",
        answer:
          "El tiempo estándar es de 5 a 7 días hábiles desde que recibo el brief y el producto. Para colaboraciones urgentes, coordinamos un tiempo de entrega express.",
        answerEn:
          "Standard turnaround is 5 to 7 business days from when I receive the brief and product. For urgent collaborations, we can coordinate an express delivery.",
        order: 0,
      },
      {
        question: "¿Qué derechos de uso incluye cada paquete?",
        questionEn: "What usage rights are included in each package?",
        answer:
          "Todos los paquetes incluyen uso orgánico en mis redes y en las de tu marca. El uso pago (whitelisting/paid ads) se cotiza aparte y se detalla siempre por escrito antes de grabar.",
        answerEn:
          "All packages include organic usage on my channels and your brand's. Paid usage (whitelisting/paid ads) is quoted separately and always detailed in writing before filming.",
        order: 1,
      },
      {
        question: "¿Haces paquetes a medida?",
        questionEn: "Do you offer custom packages?",
        answer:
          "Sí. Si tu marca necesita una cantidad de piezas, formatos o un ritmo de entrega distinto a los paquetes publicados, escríbeme y armamos una propuesta a medida.",
        answerEn:
          "Yes. If your brand needs a different number of deliverables, formats, or turnaround than the published packages, message me and we'll put together a custom proposal.",
        order: 2,
      },
    ],
  });

  await prisma.siteSettings.deleteMany();
  await prisma.siteSettings.create({
    data: {
      whyMeText:
        "Trabajo con marcas de beauty, skincare, hair, books y lifestyle creando contenido auténtico: nada de guiones forzados ni presentaciones de venta. Cuido cada detalle de grabación y edición como si fuera para mi propia cuenta, y mantengo comunicación clara y responsable en cada etapa de la colaboración, desde el brief hasta la entrega final.",
      whyMeTextEn:
        "I work with beauty, skincare, hair, books, and lifestyle brands creating authentic content: no forced scripts, no sales pitches. I care about every detail of filming and editing as if it were for my own account, and I keep clear, responsible communication at every stage of the collaboration, from the brief to final delivery.",
      contactEmail: "crisliaflores.24@gmail.com",
      collabsEmail: "crisliaflores.24@gmail.com",
      instagramHandle: "@crislia.24",
      tiktokHandle: "@crislia.24",
      footerIntro:
        "Gracias por ser parte de este espacio. Me encanta compartir contigo lo que uso, me funciona y puede hacer tu vida más fácil y bonita.",
      footerIntroEn:
        "Thanks for being part of this space. I love sharing what I use, what works for me, and what can make your life easier and more beautiful.",
      supportMessage:
        "Cada like, comentario y compartida me ayuda a seguir creando contenido que te sirve. ¡Gracias, de corazón!",
      supportMessageEn:
        "Every like, comment, and share helps me keep creating content that's useful to you. Thank you, from the heart!",
    },
  });
}
