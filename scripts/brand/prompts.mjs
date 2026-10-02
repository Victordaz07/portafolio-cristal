// Prompts de las imágenes de marca de Foliocrew. Cada una se guarda en
// public/brand/ia/<id>.png. Edita los textos y vuelve a correr
// `npm run brand:images -- <id>` para regenerar solo esa imagen.
const STYLE =
  "Brand style: Foliocrew, a platform where UGC content creators keep their portfolio and their brand collaborations in one place. " +
  "Visual motif: two overlapping rounded folio pages (one deep purple, one lavender), like the pages of a portfolio. " +
  "Palette: deep aubergine ink #251023, warm cream #FBF7F5, deep purple #7F207B, lavender #B692E7. " +
  "Editorial, warm, feminine but not cliché, clean composition, soft natural light, generous negative space. " +
  "No text, no letters, no watermarks, no logos of real brands.";

export const PROMPTS = [
  {
    id: "og-plataforma",
    orientation: "landscape",
    use: "Imagen para compartir el link de la plataforma (Open Graph, 1200×630).",
    prompt: `A creator's desk at golden hour seen from above: an open portfolio whose pages are phone screens showing short vertical videos of beauty and lifestyle products, lavender and deep purple paper pages overlapping. ${STYLE}`,
  },
  {
    id: "login-fondo",
    orientation: "portrait",
    use: "Ilustración lateral de la pantalla de entrada al panel.",
    prompt: `Flat editorial illustration of a content creator filming a skincare product with a phone on a small tripod, ring light, cozy desk with plants. ${STYLE}`,
  },
  {
    id: "bandeja-vacia",
    orientation: "square",
    use: "Ilustración para la Bandeja cuando no hay mensajes.",
    prompt: `Minimal flat illustration of an empty open folder with two overlapping lavender pages, a few paper hearts floating out, calm and happy mood. Transparent-looking plain cream background. ${STYLE}`,
  },
  {
    id: "calendario-vacio",
    orientation: "square",
    use: "Ilustración para el Calendario sin publicaciones.",
    prompt: `Minimal flat illustration of a monthly calendar page with small phone and camera stickers, a pencil, and a coffee cup, plain cream background. ${STYLE}`,
  },
  {
    id: "banner-redes",
    orientation: "landscape",
    use: "Portada para perfiles de la marca en redes y en el correo.",
    prompt: `Wide flat-lay of creator tools on a cream surface: phone showing a vertical video, mini tripod, beauty products, lilac fabric swatches, handwritten notes, arranged with lots of breathing room. ${STYLE}`,
  },
  {
    id: "patron-marca",
    orientation: "square",
    use: "Patrón de fondo con el motivo de las páginas superpuestas (fondos de posts y presentaciones).",
    prompt: `Seamless subtle pattern of thin outlined rounded rectangles overlapping like portfolio pages, lavender lines on deep aubergine background, elegant and minimal, lots of empty space. ${STYLE}`,
  },
];
