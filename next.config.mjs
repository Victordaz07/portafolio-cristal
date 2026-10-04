/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Otro sitio no puede mostrar Foliocrew dentro de un iframe (clickjacking). La vista previa del
  // Estudio y del Link en bio es del mismo dominio, así que sigue funcionando.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
