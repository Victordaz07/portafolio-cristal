// Prompts de las imágenes de marca de Vitrina UGC. Cada una se guarda en
// public/brand/ia/<id>.png. Edita los textos y vuelve a correr
// `npm run brand:images -- <id>` para regenerar solo esa imagen.
const STYLE =
  "Brand style: Vitrina UGC, a platform where UGC content creators showcase their work like a shop window. " +
  "Palette: deep aubergine ink #241227, warm cream #FBF7F5, lilac #A866BE, deep purple #801F82, soft lavender #C3ACEA. " +
  "Editorial, warm, feminine but not cliché, clean composition, soft natural light, generous negative space. " +
  "No text, no letters, no watermarks, no logos of real brands.";

export const PROMPTS = [
  {
    id: "og-plataforma",
    orientation: "landscape",
    use: "Imagen para compartir el link de la plataforma (Open Graph, 1200×630).",
    prompt: `A stylish boutique shop window at dusk with a scalloped lilac awning; inside the window, glowing phone screens display short vertical videos of beauty and lifestyle products, like products on display. ${STYLE}`,
  },
  {
    id: "login-fondo",
    orientation: "portrait",
    use: "Ilustración lateral de la pantalla de entrada al panel.",
    prompt: `Flat editorial illustration of a content creator filming a skincare product with a phone on a small tripod, ring light, cozy desk with plants, seen through a shop window frame with a scalloped awning. ${STYLE}`,
  },
  {
    id: "bandeja-vacia",
    orientation: "square",
    use: "Ilustración para la Bandeja cuando no hay mensajes.",
    prompt: `Minimal flat illustration of an empty mailbox shaped like a little storefront with a scalloped awning, a few paper hearts floating out, calm and happy mood. Transparent-looking plain cream background. ${STYLE}`,
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
    id: "logo-exploracion",
    orientation: "square",
    use: "Ideas alternativas de isotipo (solo inspiración: el logo oficial es el SVG vectorial).",
    prompt: `A sheet of 6 minimalist app icon concepts for a brand called Vitrina UGC: each a rounded square combining a shop window or scalloped awning with a play button or camera, flat vector style, solid colors only. ${STYLE}`,
  },
];
