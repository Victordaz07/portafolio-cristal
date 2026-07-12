/** @type {import('next').NextConfig} */
const nextConfig = {
  // Asegura que el motor de Prisma (generado en una ruta custom, no en
  // node_modules/.prisma/client) se incluya en el bundle de las funciones
  // serverless de Vercel.
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./lib/generated/prisma/**/*"],
    },
  },
};

export default nextConfig;
