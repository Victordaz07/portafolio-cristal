import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.hero.deleteMany();
  await prisma.hero.create({
    data: {
      name: "Cristal Amalia Flores Bello",
      location: "Santo Domingo, DR",
      niche: "UGC Creator",
      headlinePlain: "Contenido real,",
      headlineEmphasis: "filmado a mano.",
      ctaPrimaryLabel: "Trabajemos juntos",
      ctaPrimaryHref: "#contacto",
      ctaSecondaryLabel: "Ver media kit",
      ctaSecondaryHref: "#media-kit",
    },
  });

  await prisma.stat.deleteMany();
  await prisma.stat.createMany({
    data: [
      { label: "Seguidores", value: "24.5K", order: 0 },
      { label: "Engagement rate", value: "8.2%", order: 1 },
      { label: "Views promedio", value: "45K", order: 2 },
      { label: "Audiencia principal", value: "18–34 años", order: 3 },
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

  await prisma.pricingPackage.deleteMany();
  await prisma.pricingPackage.createMany({
    data: [
      {
        name: "Sencillo",
        price: "$45",
        unit: "/ video",
        deliverables: [
          "1 video UGC vertical",
          "Guion y edición básica",
          "Entrega en 5 días",
          "Uso digital por 30 días",
        ],
        featured: false,
        order: 0,
      },
      {
        name: "Bundle",
        price: "$120",
        unit: "/ paquete de 3",
        deliverables: [
          "3 piezas UGC (video o foto)",
          "Variedad de hooks y ángulos",
          "Entrega en 7 días",
          "Derechos de uso ampliados",
        ],
        featured: true,
        order: 1,
      },
      {
        name: "Mensual",
        price: "$380",
        unit: "/ mes",
        deliverables: [
          "6 piezas UGC al mes",
          "Calendario de contenido",
          "Prioridad en entregas",
          "Llamada mensual de feedback",
        ],
        featured: false,
        order: 2,
      },
    ],
  });

  await prisma.brand.deleteMany();
  await prisma.brand.createMany({
    data: [
      { name: "Charlotte Tilbury", order: 0 },
      { name: "TEMU", order: 1 },
      { name: "Ginger Milk", order: 2 },
      { name: "Dear Hair", order: 3 },
      { name: "ivoskin", order: 4 },
      { name: "American Eagle", order: 5 },
      { name: "Aromatica", order: 6 },
      { name: "Gimme Beauty Creator Club", order: 7 },
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
      instagramHandle: "@crislia.24",
      tiktokHandle: "@crislia.24",
    },
  });

  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
