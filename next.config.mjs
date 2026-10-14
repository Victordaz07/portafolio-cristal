/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Otro sitio no puede mostrar Foliocrew dentro de un iframe (clickjacking). La vista previa del
  // Estudio y del Link en bio es del mismo dominio, así que sigue funcionando.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Además: sin <base> ajeno, sin plugins (<object>/<embed>) y los formularios solo envían a este sitio.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// NOINDEX=1 (p. ej. en demo.foliocrew.pro): ningún buscador indexa ni sigue nada de este entorno.
// Se lee al construir, así que cambiarla requiere volver a desplegar (como cualquier variable en Vercel).
const noindexHeaders = process.env.NOINDEX === "1" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : [];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders, ...noindexHeaders] }];
  },
};

export default nextConfig;
