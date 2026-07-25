import type { PrismaClient } from "@prisma/client";

export async function seedDatabase(prisma: PrismaClient) {
  await prisma.hero.deleteMany();
  await prisma.hero.create({
    data: {
      name: "Cristal Amalia Flores Bello",
      location: "Santo Domingo, DR",
      niche: "UGC Creator",
      badgeLabel: "UGC Creator • Brand Reviews",
      headlinePlain: "Reseñas que",
      headlineEmphasis: "inspiran",
      headlineSuffix: "confianza.",
      description:
        "Creo contenido UGC auténtico y reseñas honestas que conectan marcas con personas de verdad.",
      photoUrl: "/images/hero-placeholder.png",
      photoUrlMobile: "/images/hero-placeholder-mobile.png",
      ctaPrimaryLabel: "Ver portafolio",
      ctaPrimaryHref: "#contenido",
      ctaSecondaryLabel: "Trabajemos juntas",
      ctaSecondaryHref: "#contacto",
    },
  });

  await prisma.stat.deleteMany();
  await prisma.stat.createMany({
    data: [
      { label: "Audiencia", value: "50K+", icon: "heart", order: 0 },
      { label: "Colaboraciones", value: "120+", icon: "people", order: 1 },
      { label: "Valoración", value: "4.9", icon: "star", order: 2 },
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
        category: "Makeup & Skincare",
        statPrimary: "120K views",
        statSecondary: "9.4% ER",
        order: 0,
      },
      {
        type: "video",
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/@crislia.24/video/0000000000000000002",
        caption: "Probando el sérum que todas piden",
        category: "Makeup & Skincare",
        statPrimary: "88K views",
        statSecondary: "7.1% ER",
        order: 1,
      },
      {
        type: "video",
        platform: "instagram",
        postUrl: "https://www.instagram.com/reel/C0000000001/",
        caption: "Transformación de cabello con Dear Hair",
        category: "Hair",
        statPrimary: "64K views",
        statSecondary: "6.8% ER",
        order: 2,
      },
      {
        type: "photo",
        platform: "instagram",
        postUrl: "https://www.instagram.com/p/C0000000002/",
        caption: "Look del día con productos Charlotte Tilbury",
        category: "Makeup & Skincare",
        statPrimary: "3.2K likes",
        statSecondary: "410 saves",
        order: 3,
      },
      {
        type: "photo",
        platform: "instagram",
        postUrl: "https://www.instagram.com/p/C0000000003/",
        caption: "Mi último libro leído — reseña sin spoilers",
        category: "Books",
        statPrimary: "2.1K likes",
        statSecondary: "560 saves",
        order: 4,
      },
      {
        type: "video",
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/@crislia.24/video/0000000000000000003",
        caption: "Un domingo tranquilo con té y libros",
        category: "Lifestyle",
        statPrimary: "51K views",
        statSecondary: "8.9% ER",
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
        category: "Skincare",
        title: "IUNIK – Tea Tree Serum",
        description: "Calma, hidrata y mejora visiblemente la piel sensible.",
        rating: 5,
        order: 0,
      },
      {
        category: "Beauty",
        title: "Cushionaire",
        description: "Cobertura ligera con acabado natural, perfecta para el día a día.",
        rating: 5,
        order: 1,
      },
      {
        category: "Lifestyle",
        title: "Mary & May – Wash Off Mask",
        description: "Textura suave que deja la piel fresca sin resecar.",
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
        description: "Videos y fotos auténticas creadas para conectar con tu audiencia.",
        order: 0,
      },
      {
        icon: "chat",
        title: "Reseñas honestas",
        description: "Opiniones reales que generan confianza y aumentan conversiones.",
        order: 1,
      },
      {
        icon: "box",
        title: "Unboxings",
        description: "Experiencias de apertura y primeras impresiones que enamoran.",
        order: 2,
      },
      {
        icon: "camera",
        title: "Fotografía de producto",
        description: "Imágenes limpias, estéticas y alineadas con tu identidad de marca.",
        order: 3,
      },
      {
        icon: "phone",
        title: "Contenido para redes",
        description: "Reels, TikToks y Shorts optimizados para cada plataforma.",
        order: 4,
      },
    ],
  });

  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: [
      {
        quote:
          "Crislia entiende perfectamente nuestra marca y crea contenido que realmente conecta con nuestra audiencia. ¡Un placer trabajar con ella!",
        name: "María G.",
        role: "Gerente de Marketing – IUNIK",
        order: 0,
      },
      {
        quote:
          "Sus reseñas son honestas, detalladas y visualmente hermosas. Hemos visto excelente engagement y conversiones.",
        name: "Laura P.",
        role: "Fundadora – Mary & May",
        order: 1,
      },
      {
        quote: "Profesional, creativa y siempre cumple con los tiempos. La recomendamos al 100%.",
        name: "Javier R.",
        role: "Brand Manager – Dr. Different",
        order: 2,
      },
    ],
  });

  await prisma.faqItem.deleteMany();
  await prisma.faqItem.createMany({
    data: [
      {
        question: "¿Cuál es el tiempo de entrega?",
        answer:
          "El tiempo estándar es de 5 a 7 días hábiles desde que recibo el brief y el producto. Para colaboraciones urgentes, coordinamos un tiempo de entrega express.",
        order: 0,
      },
      {
        question: "¿Qué derechos de uso incluye cada paquete?",
        answer:
          "Todos los paquetes incluyen uso orgánico en mis redes y en las de tu marca. El uso pago (whitelisting/paid ads) se cotiza aparte y se detalla siempre por escrito antes de grabar.",
        order: 1,
      },
      {
        question: "¿Haces paquetes a medida?",
        answer:
          "Sí. Si tu marca necesita una cantidad de piezas, formatos o un ritmo de entrega distinto a los paquetes publicados, escríbeme y armamos una propuesta a medida.",
        order: 2,
      },
    ],
  });

  await prisma.siteSettings.deleteMany();
  await prisma.siteSettings.create({
    data: {
      whyMeText:
        "Trabajo con marcas de beauty, skincare, hair, books y lifestyle creando contenido auténtico: nada de guiones forzados ni presentaciones de venta. Cuido cada detalle de grabación y edición como si fuera para mi propia cuenta, y mantengo comunicación clara y responsable en cada etapa de la colaboración, desde el brief hasta la entrega final.",
      contactEmail: "crisliaflores.24@gmail.com",
      collabsEmail: "crisliaflores.24@gmail.com",
      instagramHandle: "@crislia.24",
      tiktokHandle: "@crislia.24",
      footerIntro:
        "Gracias por ser parte de este espacio. Me encanta compartir contigo lo que uso, me funciona y puede hacer tu vida más fácil y bonita.",
      supportMessage:
        "Cada like, comentario y compartida me ayuda a seguir creando contenido que te sirve. ¡Gracias, de corazón!",
    },
  });
}
