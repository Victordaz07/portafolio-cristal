export type ManualBlock = {
  title: string;
  paragraphs?: string[];
  list?: string[];
};

export type GlossaryTerm = {
  term: string;
  def: string;
};

type Lang = "es" | "en";

export const SECTION_OPTIONS: { value: "primera-vez" | "glosario" | "reels" | "guia"; label: Record<Lang, string> }[] = [
  { value: "primera-vez", label: { es: "👋 Mi primera vez", en: "👋 My first time" } },
  { value: "glosario", label: { es: "📖 Glosario", en: "📖 Glossary" } },
  { value: "reels", label: { es: "🎬 Paso a paso: Reels y videos", en: "🎬 Step by step: Reels & videos" } },
  { value: "guia", label: { es: "🗂️ Guía completa por sección", en: "🗂️ Full section-by-section guide" } },
];

const primeraVezEs: ManualBlock[] = [
  {
    title: "¡Bienvenida a tu panel, Crislia!",
    paragraphs: [
      "Este panel es tuyo: desde aquí controlas absolutamente todo lo que se ve en tu sitio público (portafolio-cristal.vercel.app) sin necesitar a nadie que toque código.",
      "Cada sección que edites aquí se refleja al instante en el sitio real. No hay un botón de \"publicar\" aparte: al guardar, ya está en vivo.",
    ],
  },
  {
    title: "¿Cómo está organizado el menú de la izquierda?",
    list: [
      "Contenido: Hero (portada), Media kit (tus stats), Feed (fotos y videos), Marcas (con quién has colaborado).",
      "Confianza: Reseñas destacadas, Cómo trabajo, Paquetes, Testimonios — todo lo que ayuda a una marca a confiar en ti.",
      "Sitio: FAQ (preguntas frecuentes) y Contacto (tus redes, email, textos del pie de página).",
      "Mensajes: los mensajes que te escriben las marcas desde el formulario de contacto del sitio.",
    ],
  },
  {
    title: "3 cosas que vas a ver en casi todas las secciones",
    list: [
      "Campos en Español e English: casi todo texto se puede escribir en los dos idiomas — así tu sitio funciona igual de bien para marcas que hablan inglés. Si dejas el campo en inglés vacío, se usa el texto en español como respaldo.",
      "Flechas de reordenar (↑ ↓): así decides en qué orden aparece cada tarjeta, marca, reseña, etc. en el sitio público.",
      "Botón \"Ver sitio\": arriba del panel, abre tu sitio público en una pestaña nueva para que revises cómo quedó.",
    ],
  },
  {
    title: "Tu primer recorrido recomendado",
    list: [
      "1. Revisa el Hero — es lo primero que ve cualquiera. Ya tiene un panel de vista previa en vivo mientras editas.",
      "2. Confirma tus cifras en Media kit.",
      "3. Revisa que tus Marcas y logos estén al día.",
      "4. Agrega contenido nuevo en Feed cuando publiques un video o foto importante.",
      "5. Revisa Contacto para confirmar que tu email, WhatsApp y redes estén correctos.",
      "6. Da un vistazo a Mensajes de vez en cuando — ahí llegan las marcas interesadas.",
    ],
  },
  {
    title: "Un par de detalles divertidos",
    paragraphs: [
      "Escondimos un par de sorpresas para motivarte en tus días difíciles: toca dos veces seguidas el destello (✦) debajo del título del Hero (en el celular) o el corazón de \"Tu apoyo significa todo\" en el pie de página, y va a aparecer una frase motivadora al azar.",
      "También verás, muy discreto, un botón circular al final del sitio público — es el crédito del diseñador que construyó este sitio a tu medida.",
    ],
  },
];

const primeraVezEn: ManualBlock[] = [
  {
    title: "Welcome to your panel, Crislia!",
    paragraphs: [
      "This panel is all yours: from here you control everything that shows up on your public site (portafolio-cristal.vercel.app) without needing anyone to touch code.",
      "Every section you edit here reflects instantly on the real site. There's no separate \"publish\" button: once you save, it's already live.",
    ],
  },
  {
    title: "How is the left-hand menu organized?",
    list: [
      "Content: Hero (landing), Media kit (your stats), Feed (photos & videos), Brands (who you've collaborated with).",
      "Trust: Featured reviews, How I work, Packages, Testimonials — everything that helps a brand trust you.",
      "Site: FAQ (frequently asked questions) and Contact (your socials, email, footer texts).",
      "Messages: the messages brands send you through the site's contact form.",
    ],
  },
  {
    title: "3 things you'll see in almost every section",
    list: [
      "Spanish and English fields: almost every text can be written in both languages — so your site works just as well for English-speaking brands. If you leave the English field empty, the Spanish text is used as a fallback.",
      "Reorder arrows (↑ ↓): this is how you decide the order each card, brand, review, etc. appears in on the public site.",
      "\"Ver sitio\" button: at the top of the panel, opens your public site in a new tab so you can check how it looks.",
    ],
  },
  {
    title: "Your recommended first walkthrough",
    list: [
      "1. Review the Hero — it's the first thing anyone sees. It already has a live preview panel while you edit.",
      "2. Confirm your numbers in Media kit.",
      "3. Check that your Brands and logos are up to date.",
      "4. Add new content in Feed whenever you post an important video or photo.",
      "5. Check Contact to confirm your email, WhatsApp and socials are correct.",
      "6. Check Messages every now and then — that's where interested brands reach you.",
    ],
  },
  {
    title: "A couple of fun details",
    paragraphs: [
      "We hid a couple of surprises to motivate you on tough days: tap twice in a row on the sparkle (✦) below the Hero title (on mobile) or the heart on \"Your support means everything\" in the footer, and a random motivational phrase will pop up.",
      "You'll also notice a very discreet circular button at the very bottom of the public site — it's the credit for the designer who built this site around you.",
    ],
  },
];

const glosarioEs: GlossaryTerm[] = [
  { term: "Panel", def: "La página de inicio del admin — muestra accesos rápidos a cada sección y tus últimos mensajes." },
  { term: "Hero", def: "La portada del sitio: tu foto, título, descripción y los dos botones grandes (CTA)." },
  { term: "Media kit", def: "Las cifras (seguidores, colaboraciones, calificación) que se muestran junto al Hero." },
  { term: "Feed", def: "Las tarjetas de fotos y videos (incluye reels/TikToks) que se muestran en la sección de contenido." },
  { term: "Marcas", def: "El carrusel de logos de marcas con las que has colaborado." },
  { term: "Reseñas destacadas", def: "Reseñas de producto (con foto, categoría, título y calificación en estrellas)." },
  { term: "Cómo trabajo", def: "Los servicios que ofreces, cada uno con un ícono." },
  { term: "Paquetes", def: "Los paquetes de colaboración (nombre + lista de qué incluye), sin precios." },
  { term: "Testimonios", def: "Citas de marcas hablando bien de trabajar contigo." },
  { term: "FAQ", def: "Preguntas frecuentes en formato acordeón." },
  { term: "Contacto", def: "Tu email, WhatsApp, redes sociales y los textos del pie de página del sitio." },
  { term: "Mensajes recibidos", def: "El buzón con los formularios que las marcas te envían desde el sitio." },
  { term: "Campo bilingüe (ES/EN)", def: "Un par de campos — uno en español, otro en inglés — para el mismo texto. El sitio muestra uno u otro según el idioma que elija la persona que visita." },
  { term: "Orden / reordenar", def: "Las flechas ↑ ↓ junto a cada elemento de una lista; controlan en qué posición aparece en el sitio público." },
  { term: "CTA", def: "\"Call to action\": los botones que invitan a hacer algo, como \"Ver portafolio\" o \"Trabajemos juntas\"." },
  { term: "Badge / pill", def: "Una etiqueta pequeña y redondeada, como la categoría de una tarjeta del Feed o \"Nuevo\" en Mensajes." },
  { term: "Miniatura", def: "La imagen de vista previa de una tarjeta en la cuadrícula del Feed. TikTok la trae automática. Para Instagram/Facebook, al tocar \"Cargar preview\" se intenta traer sola; si no aparece, se puede subir una manualmente con el campo \"Miniatura (opcional)\"." },
  { term: "Plataforma", def: "TikTok, Instagram o Facebook — de dónde viene el post que agregas al Feed (solo aplica al modo \"Post de red social\")." },
  { term: "Video propio", def: "Un archivo de video que subes tú directamente (en vez de depender del embed de la plataforma). Explicado a fondo en \"Paso a paso: Reels\"." },
  { term: "Foto UGC de portafolio", def: "El otro tipo de tarjeta del Feed: una foto propia sin ningún link a red social. Solo pide la foto, una descripción y opcionalmente la marca para la que hiciste el trabajo (con su logo)." },
  { term: "Vista previa en vivo", def: "El panel que aparece junto al formulario del Hero mostrando cómo se ve tu portada mientras escribes, antes de guardar." },
  { term: "Ver sitio", def: "El botón arriba del panel que abre tu sitio público en una pestaña nueva." },
  { term: "Idioma del sitio (ES/EN)", def: "El botón que ven tus visitantes para cambiar entre español e inglés — no afecta al admin, solo al sitio público." },
];

const glosarioEn: GlossaryTerm[] = [
  { term: "Panel", def: "The admin home page — shows quick links to every section and your latest messages." },
  { term: "Hero", def: "The site's landing area: your photo, headline, description and the two big buttons (CTAs)." },
  { term: "Media kit", def: "The numbers (followers, collaborations, rating) shown next to the Hero." },
  { term: "Feed", def: "The photo and video cards (including reels/TikToks) shown in the content section." },
  { term: "Brands", def: "The carousel of logos from brands you've collaborated with." },
  { term: "Featured reviews", def: "Product reviews (with photo, category, title and a star rating)." },
  { term: "How I work", def: "The services you offer, each with an icon." },
  { term: "Packages", def: "The collaboration packages (name + list of what's included), no prices." },
  { term: "Testimonials", def: "Quotes from brands speaking well of working with you." },
  { term: "FAQ", def: "Frequently asked questions in an accordion format." },
  { term: "Contact", def: "Your email, WhatsApp, socials and the site footer texts." },
  { term: "Messages", def: "The inbox with the forms brands send you from the site." },
  { term: "Bilingual field (ES/EN)", def: "A pair of fields — one in Spanish, one in English — for the same text. The site shows one or the other depending on the visitor's chosen language." },
  { term: "Order / reorder", def: "The ↑ ↓ arrows next to each item in a list; they control the position it appears in on the public site." },
  { term: "CTA", def: "\"Call to action\": the buttons that invite someone to do something, like \"View portfolio\" or \"Let's work together\"." },
  { term: "Badge / pill", def: "A small rounded label, like a Feed card's category or \"New\" in Messages." },
  { term: "Thumbnail", def: "The preview image for a card in the Feed grid. TikTok fetches it automatically. For Instagram/Facebook, tapping \"Load preview\" tries to fetch it automatically; if it doesn't show up, you can upload one manually with the \"Thumbnail (optional)\" field." },
  { term: "Platform", def: "TikTok, Instagram or Facebook — where the post you add to the Feed comes from (only applies to the \"Social post\" card type)." },
  { term: "Own video", def: "A video file you upload directly (instead of relying on the platform's embed). Fully explained in \"Reels step by step\"." },
  { term: "UGC portfolio photo", def: "The other Feed card type: your own photo with no link to any social post. It only asks for the photo, a description, and optionally the brand you made it for (with its logo)." },
  { term: "Live preview", def: "The panel next to the Hero form showing how your landing looks while you type, before saving." },
  { term: "View site", def: "The button at the top of the panel that opens your public site in a new tab." },
  { term: "Site language (ES/EN)", def: "The toggle your visitors see to switch between Spanish and English — it doesn't affect the admin, only the public site." },
];

const reelsEs: ManualBlock[] = [
  {
    title: "1. Entra a Feed",
    paragraphs: ["En el menú, dentro de \"Contenido\", entra a Feed. Ahí verás todas las tarjetas actuales y el botón \"+ agregar tarjeta\"."],
  },
  {
    title: "2. Elige el tipo de tarjeta",
    paragraphs: [
      "Arriba del formulario hay dos opciones: \"Post de red social\" (para un reel, TikTok, o un post existente de Instagram/Facebook) y \"Foto UGC de portafolio\" (una foto propia, sin ningún link a red social).",
      "Si vas a agregar un reel o video, sigue con \"Post de red social\" (pasos 3 en adelante). Si solo quieres subir una foto de un trabajo que hiciste, sin post asociado, ve directo al siguiente bloque.",
    ],
  },
  {
    title: "📷 3. Si elegiste \"Foto UGC de portafolio\"",
    paragraphs: [
      "Este modo es el más simple: solo pide la foto (obligatoria), una descripción y una categoría.",
      "Opcionalmente puedes marcar la marca para la que hiciste ese trabajo — elige una existente del menú, o toca \"+ agregar nueva marca\" para crear una nueva ahí mismo (nombre + logo) sin salir del Feed. Si la marca tiene logo, se muestra sobre la foto en el sitio en vez de un ícono de red social.",
      "Con esto termina el flujo de UGC: puedes saltar directo al paso \"Completa el resto de la tarjeta\" más abajo.",
    ],
  },
  {
    title: "4. Si elegiste \"Post de red social\": plataforma y URL",
    paragraphs: [
      "Tipo: \"video\" para un reel/TikTok, \"photo\" para una imagen.",
      "Plataforma: TikTok, Instagram o Facebook — de dónde es el post original.",
      "Pega la URL completa del post y toca \"Cargar preview\" para confirmar que el link funciona y ver cómo se ve el embed.",
    ],
  },
  {
    title: "⚠️ 5. El problema conocido con TikTok",
    paragraphs: [
      "TikTok bloquea la reproducción del video embebido de forma inconsistente (a veces funciona, a veces da pantalla negra o error) — esto pasa tanto en celular como en computadora, y no es algo que se pueda arreglar desde este sitio: es una restricción que impone TikTok, no un error del panel.",
    ],
  },
  {
    title: "✅ 6. La solución: sube tu propio video",
    paragraphs: [
      "En el formulario de la tarjeta hay un campo opcional para subir el archivo de video directamente (igual que subes una foto). Si lo subes, el sitio reproduce ese archivo real en vez de intentar el embed de TikTok — así el video siempre funciona, sin depender de TikTok.",
      "Recomendación: descarga tu propio video (sin marca de agua si es posible) y súbelo aquí cada vez que agregues un reel al Feed.",
    ],
  },
  {
    title: "🖼️ 7. La miniatura para Instagram y Facebook",
    paragraphs: [
      "A diferencia de TikTok, Instagram y Facebook no dejan traer una miniatura automática de forma confiable. Al tocar \"Cargar preview\" el panel intenta traerla sola de todos modos; si lo logra, se precarga en el campo \"Miniatura (opcional)\" que aparece debajo del video.",
      "Si no la trae (a veces Instagram bloquea el intento), sube ahí mismo una captura de pantalla o foto liviana como miniatura — no hace falta resubir el video completo, solo una imagen de portada para que la tarjeta se vea bien en la cuadrícula.",
    ],
  },
  {
    title: "8. Completa el resto de la tarjeta",
    list: [
      "Caption (ES/EN): la descripción corta que se ve en el sitio.",
      "Categoría (ES/EN): puedes reusar una categoría existente o escribir una nueva.",
      "Estadísticas (opcional, ES/EN): por ejemplo \"120K vistas\" / \"120K views\", o \"3.2K me gusta\" / \"3.2K likes\" (no aplica al modo Foto UGC).",
    ],
  },
  {
    title: "9. Guarda, reordena y edita cuando quieras",
    paragraphs: [
      "Toca \"Agregar tarjeta\" para guardar. Usa las flechas ↑ ↓ para cambiar el orden en el Feed público, o \"Editar\"/\"Eliminar\" en cualquier momento.",
    ],
  },
];

const reelsEn: ManualBlock[] = [
  {
    title: "1. Go to Feed",
    paragraphs: ["In the menu, under \"Content\", go to Feed. You'll see every current card and the \"+ add card\" button."],
  },
  {
    title: "2. Choose the card type",
    paragraphs: [
      "At the top of the form there are two options: \"Social post\" (for a reel, TikTok, or an existing Instagram/Facebook post) and \"UGC portfolio photo\" (your own photo, with no link to any social post).",
      "If you're adding a reel or video, keep going with \"Social post\" (step 3 onward). If you just want to upload a photo from a job you did, with no associated post, skip straight to the next block.",
    ],
  },
  {
    title: "📷 3. If you chose \"UGC portfolio photo\"",
    paragraphs: [
      "This mode is the simplest: it only asks for the photo (required), a description and a category.",
      "You can optionally tag the brand you made that work for — pick an existing one from the dropdown, or tap \"+ add new brand\" to create one right there (name + logo) without leaving the Feed. If the brand has a logo, it's shown over the photo on the site instead of a social platform icon.",
      "That's the whole UGC flow — you can jump straight to \"Fill in the rest of the card\" below.",
    ],
  },
  {
    title: "4. If you chose \"Social post\": platform and URL",
    paragraphs: [
      "Type: \"video\" for a reel/TikTok, \"photo\" for an image.",
      "Platform: TikTok, Instagram or Facebook — where the original post is from.",
      "Paste the full post URL and tap \"Load preview\" to confirm the link works and see how the embed looks.",
    ],
  },
  {
    title: "⚠️ 5. The known TikTok issue",
    paragraphs: [
      "TikTok blocks the embedded video playback inconsistently (sometimes it works, sometimes it shows a black screen or an error) — this happens on both mobile and desktop, and it's not something this site can fix: it's a restriction TikTok itself imposes, not a bug in the panel.",
    ],
  },
  {
    title: "✅ 6. The fix: upload your own video",
    paragraphs: [
      "The card form has an optional field to upload the video file directly (just like uploading a photo). If you upload it, the site plays that real file instead of trying TikTok's embed — so the video always works, without depending on TikTok.",
      "Recommendation: download your own video (without a watermark if possible) and upload it here every time you add a reel to the Feed.",
    ],
  },
  {
    title: "🖼️ 7. The thumbnail for Instagram and Facebook",
    paragraphs: [
      "Unlike TikTok, Instagram and Facebook don't reliably offer an automatic thumbnail. Tapping \"Load preview\" still tries to fetch one automatically; if it works, it pre-fills the \"Thumbnail (optional)\" field that shows up under the video.",
      "If it doesn't come through (Instagram sometimes blocks the attempt), upload a screenshot or a light photo there yourself as the thumbnail — no need to re-upload the whole video, just a cover image so the card looks good in the grid.",
    ],
  },
  {
    title: "8. Fill in the rest of the card",
    list: [
      "Caption (ES/EN): the short description shown on the site.",
      "Category (ES/EN): you can reuse an existing category or write a new one.",
      "Stats (optional, ES/EN): for example \"120K vistas\" / \"120K views\", or \"3.2K me gusta\" / \"3.2K likes\" (doesn't apply to UGC mode).",
    ],
  },
  {
    title: "9. Save, reorder and edit anytime",
    paragraphs: [
      "Tap \"Add card\" to save. Use the ↑ ↓ arrows to change the order on the public Feed, or \"Edit\"/\"Delete\" anytime.",
    ],
  },
];

const guiaEs: ManualBlock[] = [
  {
    title: "Panel",
    paragraphs: ["Tu página de inicio: accesos rápidos con conteos (stats, tarjetas de Feed, marcas activas, preguntas FAQ, mensajes sin leer) y tus últimos 3 mensajes."],
  },
  {
    title: "Hero",
    paragraphs: [
      "La portada del sitio. Incluye: nombre, ubicación, nicho, badge (la pill arriba del título), título en 3 partes (línea 1 / palabra en color / resto), descripción, foto de escritorio y de mobile, y los dos botones (CTA primario y secundario) con su texto y link.",
      "Tiene un panel de vista previa en vivo a la derecha del formulario, así ves el resultado antes de guardar.",
    ],
  },
  {
    title: "Media kit",
    paragraphs: ["Las cifras que aparecen junto al Hero (por ejemplo seguidores, colaboraciones, calificación), cada una con su ícono, label y valor."],
  },
  {
    title: "Feed",
    paragraphs: [
      "El contenido de fotos y videos. Cada tarjeta puede ser un \"Post de red social\" (vinculado a TikTok, Instagram o Facebook) o una \"Foto UGC de portafolio\" (una foto propia, sin ningún link, con marca opcional).",
      "Ver la guía completa en \"Paso a paso: Reels y videos\" para el detalle de cómo agregar cada tipo correctamente, incluida la miniatura para Instagram/Facebook.",
    ],
  },
  {
    title: "Marcas",
    paragraphs: [
      "El carrusel de logos. Cada marca tiene nombre, logo, link a su web (opcional) y un estado activo/inactivo — las inactivas dejan de mostrarse en el sitio sin necesidad de borrarlas.",
      "También puedes crear una marca nueva sin salir de Feed: al agregar una tarjeta de tipo \"Foto UGC\", el selector de marca tiene la opción \"+ agregar nueva marca\" (nombre + logo).",
    ],
  },
  {
    title: "Reseñas destacadas",
    paragraphs: ["Reseñas de producto con foto opcional, categoría, título, descripción y calificación de 1 a 5 estrellas."],
  },
  {
    title: "Cómo trabajo",
    paragraphs: ["Tus servicios, cada uno con un ícono (cámara, chat, caja o teléfono), título y descripción."],
  },
  {
    title: "Paquetes",
    paragraphs: ["Los paquetes de colaboración: emoji, nombre y una lista de qué incluye (un ítem por línea), sin precios."],
  },
  {
    title: "Testimonios",
    paragraphs: ["Citas de marcas: la cita, el nombre de la persona, su rol/marca y una foto opcional."],
  },
  {
    title: "FAQ",
    paragraphs: ["Preguntas y respuestas que se muestran en formato acordeón en el sitio."],
  },
  {
    title: "Contacto",
    paragraphs: ["El texto \"por qué trabajar conmigo\", el texto de introducción y de agradecimiento del pie de página, y tus datos: email, WhatsApp, email de colaboraciones, sitio web, Instagram, TikTok, YouTube, Facebook y Pinterest."],
  },
  {
    title: "Mensajes recibidos",
    paragraphs: ["Los mensajes que las marcas te envían desde el formulario de contacto del sitio. Puedes marcarlos como leídos/no leídos."],
  },
];

const guiaEn: ManualBlock[] = [
  {
    title: "Panel",
    paragraphs: ["Your home page: quick links with counts (stats, Feed cards, active brands, FAQ questions, unread messages) and your latest 3 messages."],
  },
  {
    title: "Hero",
    paragraphs: [
      "The site's landing area. Includes: name, location, niche, badge (the pill above the title), a 3-part title (line 1 / colored word / rest), description, desktop and mobile photos, and the two buttons (primary and secondary CTA) with their text and link.",
      "It has a live preview panel to the right of the form, so you see the result before saving.",
    ],
  },
  {
    title: "Media kit",
    paragraphs: ["The numbers shown next to the Hero (e.g. followers, collaborations, rating), each with its icon, label and value."],
  },
  {
    title: "Feed",
    paragraphs: [
      "The photo and video content. Each card can be a \"Social post\" (linked to TikTok, Instagram or Facebook) or a \"UGC portfolio photo\" (your own photo, no link, with an optional brand tag).",
      "See the full guide under \"Reels & videos step by step\" for the details on adding each type correctly, including the Instagram/Facebook thumbnail.",
    ],
  },
  {
    title: "Brands",
    paragraphs: [
      "The logo carousel. Each brand has a name, logo, an optional website link, and an active/inactive status — inactive ones stop showing on the site without needing to delete them.",
      "You can also create a new brand without leaving Feed: when adding a \"UGC photo\" card, the brand dropdown has a \"+ add new brand\" option (name + logo).",
    ],
  },
  {
    title: "Featured reviews",
    paragraphs: ["Product reviews with an optional photo, category, title, description and a 1-to-5 star rating."],
  },
  {
    title: "How I work",
    paragraphs: ["Your services, each with an icon (camera, chat, box or phone), title and description."],
  },
  {
    title: "Packages",
    paragraphs: ["The collaboration packages: emoji, name and a list of what's included (one item per line), no prices."],
  },
  {
    title: "Testimonials",
    paragraphs: ["Quotes from brands: the quote itself, the person's name, their role/brand and an optional photo."],
  },
  {
    title: "FAQ",
    paragraphs: ["Questions and answers shown in an accordion on the site."],
  },
  {
    title: "Contact",
    paragraphs: ["The \"why work with me\" text, the footer's intro and thank-you texts, and your details: email, WhatsApp, collab email, website, Instagram, TikTok, YouTube, Facebook and Pinterest."],
  },
  {
    title: "Messages",
    paragraphs: ["The messages brands send you through the site's contact form. You can mark them read/unread."],
  },
];

export const MANUAL = {
  es: { primeraVez: primeraVezEs, glosario: glosarioEs, reels: reelsEs, guia: guiaEs },
  en: { primeraVez: primeraVezEn, glosario: glosarioEn, reels: reelsEn, guia: guiaEn },
};
