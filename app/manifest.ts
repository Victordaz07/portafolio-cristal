import type { MetadataRoute } from "next";

/** App instalable (E5): el panel se puede añadir a la pantalla de inicio del celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foliocrew",
    short_name: "Foliocrew",
    description: "Tu portafolio y tu negocio de creadora en un solo lugar.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#FBF7F5",
    theme_color: "#251023",
    icons: [
      { src: "/brand/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
