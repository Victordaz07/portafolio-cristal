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
    title: "¡Te damos la bienvenida a tu panel de Foliocrew!",
    paragraphs: [
      "Al crear tu cuenta, el asistente de bienvenida arma tu sitio en 4 pasos: tu perfil (foto, nombre y nicho), tus textos (portada, bio, servicios, paquetes y preguntas frecuentes según tu nicho, en español e inglés), tu mejor contenido (pega hasta 3 links de Instagram, TikTok o Facebook) y tu contacto y color. Después, en el Resumen, la lista \"Completa tu sitio\" te muestra lo que falta.",
      "Este panel es tuyo: desde aquí controlas absolutamente todo lo que se ve en tu sitio público (la dirección está en Ayuda → Mi cuenta) sin necesitar a nadie que toque código.",
      "Cada sección que edites aquí se refleja al instante en el sitio real. No hay un botón de \"publicar\" aparte: al guardar, ya está en vivo.",
    ],
  },
  {
    title: "¿Cómo está organizado el menú de la izquierda?",
    list: [
      "Resumen (arriba de todo): tu panorama del día — seguimientos con marcas, pagos, mensajes sin leer y últimas publicaciones.",
      "Crecimiento: Metas y plan (tus metas con progreso y el plan de la semana) y Bitácora (hitos, aprendizajes y diario).",
      "Contenido: Feed (fotos y videos de tu portafolio), Calendario (tu plan del mes) y Crear (armar una publicación con ayuda de la IA).",
      "Landing: Portada (Hero), Media kit (tus stats), Cómo trabajo, Paquetes, FAQ y Contacto y pie — todo lo que se ve en tu sitio público.",
      "Prueba social: Marcas (tu CRM de tratos y el carrusel de logos), Reseñas destacadas y Testimonios.",
      "Negocio: Bandeja (mensajes del formulario y comentarios de Instagram), Reportes (tu crecimiento, ingresos y reporte del mes en PDF) y Conectar cuentas.",
      "Cada grupo se abre y se cierra tocando su título; el panel recuerda cómo lo dejaste.",
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
    title: "Welcome to your Foliocrew panel!",
    paragraphs: [
      "When you sign up, the welcome assistant builds your site in 4 steps: your profile (photo, name and niche), your texts (hero, bio, services, packages and FAQ based on your niche, in Spanish and English), your best content (paste up to 3 Instagram, TikTok or Facebook links) and your contact info and color. Then, on the Summary, the \"Complete your site\" list shows what's left.",
      "This panel is all yours: from here you control everything that shows up on your public site (its address is under Help → My account) without needing anyone to touch code.",
      "Every section you edit here reflects instantly on the real site. There's no separate \"publish\" button: once you save, it's already live.",
    ],
  },
  {
    title: "How is the left-hand menu organized?",
    list: [
      "Summary (at the very top): your overview for the day — brand follow-ups, payments, unread messages and latest posts.",
      "Growth: Goals & plan (your goals with progress and the weekly plan) and Log (milestones, learnings and journal).",
      "Content: Feed (your portfolio photos & videos), Calendar (your monthly plan) and Create (build a post with AI help).",
      "Landing: Hero, Media kit (your stats), How I work, Packages, FAQ and Contact & footer — everything shown on your public site.",
      "Social proof: Brands (your deals CRM and the logo carousel), Featured reviews and Testimonials.",
      "Business: Inbox (contact-form messages and Instagram comments), Reports (your growth, revenue and monthly PDF report) and Connect accounts.",
      "Tap a group's title to open or close it; the panel remembers how you left it.",
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
  { term: "CTA", def: "\"Call to action\": los botones que invitan a hacer algo, como \"Ver portafolio\" o \"Colaboremos\"." },
  { term: "Badge / pill", def: "Una etiqueta pequeña y redondeada, como la categoría de una tarjeta del Feed o \"Nuevo\" en Mensajes." },
  { term: "Correo para entrar", def: "El correo con el que inicias sesión. Lo cambias en Ayuda → Mi cuenta (pide tu contraseña): entras con el nuevo, te llega un enlace para confirmarlo y al anterior le avisamos." },
  { term: "Ajustar encuadre", def: "Al elegir una foto, el panel abre \"Ajusta tu foto\": arrástrala y usa el zoom para encuadrarla en la forma en que se verá en tu sitio (cada campo indica su medida ideal). Puedes tocar \"Subir sin recortar\" para dejarla como está, y \"Ajustar encuadre\" para volver a encuadrar una foto ya subida." },
  { term: "Miniatura", def: "La imagen de vista previa de una tarjeta en la cuadrícula del Feed. TikTok la trae automática. Para Instagram/Facebook se trae sola al tocar \"Cargar preview\" y, si la cuenta está conectada, también se renueva sola todos los días por si el link de Instagram/Facebook caduca; si nunca llega, se puede subir una manualmente con el campo \"Miniatura (opcional)\"." },
  { term: "Plataforma", def: "TikTok, Instagram o Facebook — de dónde viene el post que agregas al Feed (solo aplica al modo \"Post de red social\")." },
  { term: "Video propio", def: "Un archivo de video que subes tú directamente (en vez de depender del embed de la plataforma). Explicado a fondo en \"Paso a paso: Reels\"." },
  { term: "Foto de portafolio", def: "El otro tipo de tarjeta del Feed: una foto propia sin ningún link a red social. Solo pide la foto, una descripción y opcionalmente la marca para la que hiciste el trabajo (con su logo)." },
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
  { term: "Login email", def: "The email you sign in with. Change it in Help → My account (asks for your password): you sign in with the new one, it gets a confirmation link, and we notify the old one." },
  { term: "Adjust framing", def: "When you pick a photo, the panel opens \"Adjust your photo\": drag and zoom to frame it in the shape it will have on your site (each field shows its ideal size). Tap \"Upload without cropping\" to keep it as is, or \"Adjust framing\" to reframe a photo you already uploaded." },
  { term: "Thumbnail", def: "The preview image for a card in the Feed grid. TikTok fetches it automatically. For Instagram/Facebook, tapping \"Load preview\" fetches it and stores a permanent copy (Instagram/Facebook links expire); if your account is connected it is also renewed automatically every day. If it never shows up, you can upload one manually with the \"Thumbnail (optional)\" field." },
  { term: "Platform", def: "TikTok, Instagram or Facebook — where the post you add to the Feed comes from (only applies to the \"Social post\" card type)." },
  { term: "Own video", def: "A video file you upload directly (instead of relying on the platform's embed). Fully explained in \"Reels step by step\"." },
  { term: "Portfolio photo", def: "The other Feed card type: your own photo with no link to any social post. It only asks for the photo, a description, and optionally the brand you made it for (with its logo)." },
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
      "Arriba del formulario hay dos opciones: \"Post de red social\" (para un reel, TikTok, o un post existente de Instagram/Facebook) y \"Foto de portafolio\" (una foto propia, sin ningún link a red social).",
      "Si vas a agregar un reel o video, sigue con \"Post de red social\" (pasos 3 en adelante). Si solo quieres subir una foto de un trabajo que hiciste, sin post asociado, ve directo al siguiente bloque.",
    ],
  },
  {
    title: "📷 3. Si elegiste \"Foto de portafolio\"",
    paragraphs: [
      "Este modo es el más simple: solo pide la foto (obligatoria), una descripción y una categoría.",
      "Opcionalmente puedes marcar la marca para la que hiciste ese trabajo — elige una existente del menú, o toca \"+ agregar nueva marca\" para crear una nueva ahí mismo (nombre + logo) sin salir del Feed. Si la marca tiene logo, se muestra sobre la foto en el sitio en vez de un ícono de red social.",
      "Con esto termina el flujo de la foto de portafolio: puedes saltar directo al paso \"Completa el resto de la tarjeta\" más abajo.",
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
      "A diferencia de TikTok, Instagram y Facebook no siempre dejan traer la miniatura al toque. Al tocar \"Cargar preview\" el panel intenta traerla sola; si lo logra, la guarda en nuestro propio almacenamiento (no como un link directo de Instagram/Facebook, que caduca) y se precarga en el campo \"Miniatura (opcional)\" que aparece debajo del video.",
      "Además, si tienes la cuenta conectada en 'Conectar cuentas', todos los días el sistema revisa solo las tarjetas sin miniatura (o con una que ya caducó) y la rellena automáticamente — sin que tengas que entrar a hacer nada.",
      "Si aun así no llega (a veces Instagram bloquea el intento y la cuenta no está conectada), sube ahí mismo una captura de pantalla o foto liviana como miniatura — no hace falta resubir el video completo, solo una imagen de portada para que la tarjeta se vea bien en la cuadrícula.",
    ],
  },
  {
    title: "8. Completa el resto de la tarjeta",
    list: [
      "Caption (ES/EN): la descripción corta que se ve en el sitio.",
      "Categoría (ES/EN): puedes reusar una categoría existente o escribir una nueva.",
      "Estadísticas (opcional, ES/EN): por ejemplo \"120K vistas\" / \"120K views\", o \"3.2K me gusta\" / \"3.2K likes\" (no aplica al modo Foto de portafolio).",
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
      "At the top of the form there are two options: \"Social post\" (for a reel, TikTok, or an existing Instagram/Facebook post) and \"Portfolio photo\" (your own photo, with no link to any social post).",
      "If you're adding a reel or video, keep going with \"Social post\" (step 3 onward). If you just want to upload a photo from a job you did, with no associated post, skip straight to the next block.",
    ],
  },
  {
    title: "📷 3. If you chose \"Portfolio photo\"",
    paragraphs: [
      "This mode is the simplest: it only asks for the photo (required), a description and a category.",
      "You can optionally tag the brand you made that work for — pick an existing one from the dropdown, or tap \"+ add new brand\" to create one right there (name + logo) without leaving the Feed. If the brand has a logo, it's shown over the photo on the site instead of a social platform icon.",
      "That's the whole portfolio-photo flow — you can jump straight to \"Fill in the rest of the card\" below.",
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
      "Stats (optional, ES/EN): for example \"120K vistas\" / \"120K views\", or \"3.2K me gusta\" / \"3.2K likes\" (doesn't apply to portfolio-photo mode).",
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
      "El contenido de fotos y videos. Cada tarjeta puede ser un \"Post de red social\" (vinculado a TikTok, Instagram o Facebook) o una \"Foto de portafolio\" (una foto propia, sin ningún link, con marca opcional).",
      "Ver la guía completa en \"Paso a paso: Reels y videos\" para el detalle de cómo agregar cada tipo correctamente, incluida la miniatura para Instagram/Facebook.",
    ],
  },
  {
    title: "Marcas",
    paragraphs: [
      "Marcas tiene dos pestañas: \"Tratos\" (tu CRM de colaboraciones) y \"Carrusel del sitio\" (los logos que se ven en tu sitio público).",
      "En Tratos, cada marca puede tener un estado (Prospecto, Negociando, Activo, Completado), contacto, valor del trato, paquete, plataformas, próximo paso con fecha límite, estado de pago y notas. Toca una marca de la lista para ver su detalle; desde ahí cambias el estado o el pago con un toque.",
      "El historial del acuerdo se llena solo cuando cambias el estado o el pago, y también puedes agregar entradas a mano (ej: \"Contraoferta de la marca: $800\"). Al agregar una, la fecha se toma como último contacto.",
      "Los datos del trato (valor, contacto, notas) son privados: nunca se muestran en el sitio público. Una marca nueva creada como trato queda oculta del carrusel hasta que marques \"Mostrar el logo en el carrusel\".",
      "Los próximos pasos y los pagos aparecen en el Resumen, con aviso cuando algo está vencido.",
      "En cada trato puedes anotar los entregables (ej.: \"Reel de 30 s\" para el 15 de octubre), marcar en qué va cada uno (por hacer, borrador, en revisión, aprobado, publicado), ordenarlos con ↑ ↓ y guardar el enlace de la entrega. Te avisamos por correo 2 días antes de cada fecha.",
      "Al editar un trato también anotas los derechos de uso (cuánto tiempo la marca puede usar tu contenido y desde cuándo), la exclusividad y si incluye whitelisting. 7 días antes de que venzan los derechos te avisamos por correo y en el Resumen, para que cobres la renovación.",
      "¿No sabes cuánto cobrar? Toca \"💰 ¿Cuánto cobro?\" (arriba en Marcas o junto al valor del trato). Elige red, formato, cantidad, derechos de uso, exclusividad y whitelisting, y verás un rango bajo, justo y alto calculado con tus seguidores, tus vistas y tu interacción. \"Usar\" llena el valor del trato (y el paquete, si estaba vacío).",
      "En Carrusel del sitio ordenas los logos con ↑ ↓ y eliges cuáles se muestran u ocultan (sin borrarlos).",
      "También puedes crear una marca nueva sin salir de Feed: al agregar una tarjeta de tipo \"Foto de portafolio\", el selector de marca tiene la opción \"+ agregar nueva marca\" (nombre + logo).",
    ],
  },
  {
    title: "Conectar cuentas",
    paragraphs: [
      "En Negocio → Conectar cuentas conectas Instagram, Facebook, TikTok y YouTube con su login oficial (el mismo botón \"Iniciar sesión con…\" de cada red). El panel nunca ve tu contraseña.",
      "Después de conectar, toca \"Probar\": el panel le pide a la red tu perfil y tus 6 publicaciones más recientes, y te muestra lo que respondió o el error exacto.",
      "Cada tarjeta explica qué se puede y qué no se puede hacer con esa red (por ejemplo, TikTok no permite leer DMs). \"Desconectar\" borra los permisos guardados en el panel.",
      "Abajo está la prueba de la IA (Claude), que se usará para sugerir captions.",
      "Si una red dice \"Sin configurar\", faltan las claves de su app de desarrollador: eso lo prepara quien administra el sitio (guía en docs/conectar-cuentas.md).",
    ],
  },
  {
    title: "Metas y plan",
    paragraphs: [
      "Crea metas con un valor actual y un objetivo (ej: \"Publicar 25 piezas este mes\"). La barra muestra tu avance y arriba ves el promedio de todas tus metas, junto a una frase motivadora distinta cada día.",
      "Algunas metas se actualizan solas: seguidores de Instagram, TikTok, YouTube o Facebook (si conectaste la red) y publicaciones del Feed en el mes. Las manuales las ajustas con los botones − y +.",
      "El plan de acción es tu lista de tareas de la semana: márcalas al terminarlas. Si te quedaron pendientes de semanas anteriores, el panel te ofrece traerlas a la semana actual.",
    ],
  },
  {
    title: "Bitácora",
    paragraphs: [
      "La línea de hitos guarda tus logros (\"Primera colaboración pagada\") y tus aprendizajes (\"Negociar el brief por escrito evita retrabajos\").",
      "El diario de contenido es para una reflexión corta cada semana: qué funcionó, qué no y qué vas a probar.",
      "La racha cuenta los días seguidos en que hiciste algo: una entrada en la bitácora, una tarea del plan completada o una publicación nueva en el Feed. También la ves en el Resumen.",
    ],
  },
  {
    title: "Crear publicación",
    paragraphs: [
      "Elige el tipo (post, carrusel, reel, video largo o historia), en qué redes va y si es para una marca. Escribe el caption o toca \"Sugerir con IA\": la IA te da 3 opciones usando el tema, la marca y tu estilo; toca la que te guste para usarla.",
      "Mientras escribes ves una vista previa por red y, a la derecha, consejos de la IA para ejecutarlo en cada una. También te avisa si pasas el límite de caracteres o de hashtags de alguna red.",
      "Si la publicación es para una marca, revisamos que el texto diga que es publicidad y que se vea antes del \"ver más\" (en las primeras ~100 a 125 letras, según la red). Si falta, toca \"Agregar #publicidad al inicio\"; si está muy abajo, \"Mover el aviso al inicio\". #colaboración o #collab solos no bastan. En el Calendario marcamos con ⚠ las que todavía no lo tienen. Además, usa la etiqueta de colaboración pagada de cada red. Es una guía de referencia (FTC de EE. UU.), no asesoría legal.",
      "Elige día y hora y toca \"Programar\" (o guárdala como borrador). Por ahora no se publica sola: la ves en el Calendario y en el Resumen para subirla ese día.",
    ],
  },
  {
    title: "Calendario",
    paragraphs: [
      "Vista del mes con puntos de color por red en cada día que tiene algo programado. Toca un día para ver qué hay y programar algo nuevo ese día.",
      "Cuando subas la publicación, toca \"Marcar publicada\". Si alguna ya pasó su fecha y no la marcaste, aparece arriba en \"¿Ya las publicaste?\". Marcar publicaciones también suma a tu racha.",
    ],
  },
  {
    title: "Métricas del Feed",
    paragraphs: [
      "Cada tarjeta del Feed muestra 4 números: vistas, likes, comentarios y engagement. El engagement se calcula solo: (likes + comentarios + compartidos + guardados) ÷ vistas.",
      "Toca \"Métricas\" en una tarjeta para escribir los números a mano y el comentario destacado (\"Lo que dicen\"), con quién lo dijo. También puedes ocultar las métricas de esa pieza en el sitio público.",
      "Si conectaste Instagram o TikTok, el botón \"↻ Sincronizar métricas\" trae los números de tus publicaciones (las encuentra por el link de cada tarjeta). Instagram todavía no entrega vistas; esas se escriben a mano.",
      "En las tarjetas con marca, \"☆ Destacar\" elige qué piezas aparecen en la sección Colaboraciones del sitio (hasta 3 por marca). Si no destacas ninguna, se muestran las primeras de esa marca.",
    ],
  },
  {
    title: "Vista pública",
    paragraphs: [
      "Muestra tu sitio tal cual lo ve una marca, dentro del panel. Puedes verlo en modo escritorio o celular y en español o inglés.",
    ],
  },
  {
    title: "Mi dominio",
    paragraphs: [
      "Aquí ves la dirección de tu sitio para compartir con marcas (con botón para copiarla) y tus otras direcciones: tu subdominio de Foliocrew (tunombre.foliocrew.pro) y la dirección provisional.",
      "Para usar tu propio dominio (por ejemplo, tunombre.com), cómpralo donde prefieras, escríbelo aquí y toca \"Conectar dominio\". El panel te muestra el registro DNS exacto (tipo, nombre y valor) que tienes que agregar en tu proveedor. Después toca \"Comprobar ahora\": cuando diga \"Conectado ✓\", tu sitio ya se ve en tu dominio con HTTPS. Los cambios de DNS pueden tardar hasta 48 h.",
    ],
  },
  {
    title: "Estudio de diseño",
    paragraphs: [
      "Aquí decides cómo se ve tu sitio, con una vista previa en vivo (en computadora o celular) que cambia mientras eliges. Nada se publica hasta que tocas \"Guardar diseño\".",
      "Estilo: Editorial, Minimal, Noche, Soft o Bold. Cada uno cambia fondo y colores base, y ajusta de un clic la tipografía, los bordes, el fondo y la portada (después puedes cambiar cada cosa).",
      "Color de acento: 6 paletas o tu color propio. Si tu color es muy claro, lo oscurecemos un poco para que el texto de los botones se lea. El color también se usa en este panel.",
      "Tipografía (Editorial, Elegante, Moderna, Clásica, Divertida o Impacto), portada (foto a un lado, foto de fondo, centrada o revista), bordes (rectos, suaves o redondos) y fondo (liso, textura o degradado).",
      "Orden de las secciones: súbelas, bájalas u ocúltalas. La portada va siempre arriba y el contacto al final.",
      "\"Diséñalo por mí\": Claude te propone una combinación según tu nicho y tu bio; toca \"Otra idea\" para ver más. También aquí cambias tu foto, tu nombre y tu bio.",
    ],
  },
  {
    title: "Link en bio",
    paragraphs: [
      "Tu página para la bio de Instagram y TikTok (tusitio/links). A la derecha ves la página real; toca cualquier parte (el encabezado, la tarjeta principal, un grupo o un enlace) y se abre su edición a la izquierda. Los cambios se guardan solos.",
      "La página se arma con bloques en orden: el encabezado y la tarjeta principal van siempre arriba; debajo, tus grupos (\"Colabora conmigo\", \"Mis favoritos\"…) y dos bloques automáticos: \"Trabaja conmigo\" (media kit y contacto) y \"Contenido reciente\" (tu Feed). Súbelos o bájalos con las flechas o arrastrándolos (⋮⋮), y ocúltalos con el ojo sin borrarlos.",
      "En cada grupo agregas enlaces con título en español e inglés, imagen o logo, fila o tarjeta, palabra de acción (\"Comprar\"), etiqueta destacada (\"Abierto ahora\") y descuento (\"15% OFF\"). Puedes moverlos de grupo, reordenarlos u ocultarlos un tiempo. El más visitado lleva \"Más clics\" solo.",
      "En la tarjeta principal cambias la etiqueta, el título, la imagen y a dónde lleva (por defecto, tu portafolio). En el encabezado, la frase bajo tu nombre y si se ven \"Copiar mi enlace\" y tus redes. Colores, tipografía y fondo se eligen en Estudio de diseño.",
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
    title: "Bandeja",
    paragraphs: [
      "Todo lo que te escriben en un solo lugar: los mensajes del formulario de contacto del sitio y, si conectaste Instagram, los comentarios de tus últimas publicaciones. Filtra con los chips de arriba: Todas, Por responder, Formulario o Instagram.",
      "Cada mensaje dice si está Pendiente o Respondido. Si quien escribe es una marca de tu CRM, aparece la etiqueta \"Cliente\". Si un mensaje del formulario lleva más de 24 h sin respuesta, te avisa: las marcas suelen quedarse con quien contesta primero.",
      "Formulario: toca \"Responder\", elige una respuesta rápida (por ejemplo, la que incluye el enlace a tu media kit) o escribe la tuya, y toca \"Abrir en mi correo\". Se abre tu correo con todo listo para enviar, y el mensaje queda como respondido.",
      "Instagram: la respuesta se publica directo en el comentario. También puedes ocultar un comentario (solo lo ven tú y quien lo escribió) o borrarlo.",
      "Los mensajes directos (DM) llegarán más adelante: necesitan la revisión de Meta.",
    ],
  },
  {
    title: "Acuerdos",
    paragraphs: [
      "Un acuerdo (contrato simple) deja por escrito qué entregas, cuánto te pagan, el anticipo, los derechos de uso, la exclusividad, las revisiones y la cancelación, antes de empezar. Así bajan mucho los problemas de marcas que desaparecen después de publicar.",
      "Créalo desde Acuerdos → \"+ Nuevo acuerdo\" o desde un trato en Marcas (\"Crear acuerdo\"). Elige la plantilla (publicación patrocinada, UGC sin publicar, embajador mensual o afiliado), llena los huecos y mira a la derecha cómo queda el texto. Si vienes de un trato, se llena con su monto, entregables y derechos de uso.",
      "Se guarda como borrador. Toca \"Enviar a la marca\": le llega un correo con un enlace. La marca lo lee, escribe su nombre y correo y lo acepta. Quedan guardados su nombre, correo, fecha, hora y dirección IP, y los dos reciben una copia por correo. El trato pasa a \"Activo\" solo.",
      "Si la marca pide cambios, te avisamos con lo que escribió: tócalo para editarlo y volver a enviarlo. Un acuerdo aceptado ya no se puede cambiar. Es una plantilla de referencia: Foliocrew no es un despacho legal, y para acuerdos grandes conviene que lo revise un abogado.",
    ],
  },
  {
    title: "Facturas",
    paragraphs: [
      "Primero completa tus datos para facturar (abajo en Facturas): el nombre que va en la factura, tu ciudad, cómo te pagan (PayPal, Zelle…), el plazo para pagar y el % de anticipo. Nunca pongas tu número de seguro social ni números de cuenta completos.",
      "Crea una factura desde Facturas → \"+ Nueva factura\", o desde un trato en Marcas (\"Crear factura\", \"Factura de anticipo\" o \"Factura de saldo\"): se llena sola con la marca, el contacto, el paquete y el monto.",
      "Se guarda como borrador. Cuando esté lista, toca \"Enviar a la marca\": le llega un correo con un enlace donde la ve, la descarga en PDF y puede avisar \"Ya pagamos\". Te avisamos cuando la abre y cuando dice que pagó.",
      "Si se atrasa, le mandamos recordatorios amables el día que vence y a los 7 y 14 días (máximo 3). Cuando te llegue el dinero, toca \"Marcar pagada\": cuando todas las facturas de un trato están pagadas, el trato pasa a \"Pagado\" solo.",
    ],
  },
  {
    title: "Reportes",
    paragraphs: [
      "Tu crecimiento en números: seguidores totales y de los últimos 30 días, engagement promedio, publicaciones del mes, un gráfico de seguidores mes a mes, el mejor día y horario para publicar (según el engagement de tus publicaciones con fecha y métricas) y tus ingresos por marca.",
      "\"Actualizar desde redes conectadas\" guarda los seguidores de hoy de cada red conectada. Las que no estén conectadas se pueden cargar a mano. En \"Reporte mensual (PDF)\" elige el mes y toca \"Ver reporte\": usa \"Guardar como PDF\" al imprimir y mándalo a una marca.",
      "Tu media kit público vive en /media-kit: cópialo desde Reportes con \"Copiar enlace\" y pégalo en tu bio o en tus correos.",
    ],
  },
  {
    title: "Comunidad",
    paragraphs: [
      "La Comunidad es un muro solo para cuentas de Foliocrew, con creadores de todo tipo (YouTube, TikTok, Instagram, podcast, streaming, UGC, fotografía…). La primera vez revisas tu perfil (ya viene armado con tus datos) y aceptas las reglas.",
      "Puedes publicar una pregunta, un consejo, un logro, una búsqueda de colaboración o un recurso. Filtra el muro por tipo, tema o tipo de creador, y usa \"Destacadas\" para ver lo que más está ayudando.",
      "Marca \"💡 Me sirvió\" en lo que te ayude y, si preguntaste, elige la \"Mejor respuesta\": así quien ayuda gana puntos y sube de nivel. Te avisamos por correo cuando te responden (lo puedes apagar en Mi perfil).",
      "Si algo rompe las reglas, toca \"Reportar\" (es anónimo). También puedes bloquear a alguien desde su perfil. Cada semana el equipo fija una pregunta para conversar.",
      "Para conectar con alguien, entra a su perfil y toca \"+ Conectar\" (puedes agregar una nota). Las solicitudes que te llegan están en Comunidad → Conexiones, donde las aceptas o rechazas. Rechazar es discreto: la otra persona no recibe aviso.",
      "Con tus conexiones puedes escribirte en Comunidad → Mensajes (o con \"💬 Mensaje\" en su perfil). Los mensajes nuevos aparecen solos cada pocos segundos y también te avisamos por correo. Son privados: nadie del equipo los lee, salvo que alguien reporte un mensaje.",
      "¿Buscas con quién colaborar? En Comunidad → Buscar creadores filtra por red, nicho, ciudad o idioma, o marca \"Solo abiertos a colaborar\". Para aparecer ahí con ese sello, activa \"Abierto a colaborar\" en Mi perfil.",
    ],
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
      "The photo and video content. Each card can be a \"Social post\" (linked to TikTok, Instagram or Facebook) or a \"Portfolio photo\" (your own photo, no link, with an optional brand tag).",
      "See the full guide under \"Reels & videos step by step\" for the details on adding each type correctly, including the Instagram/Facebook thumbnail.",
    ],
  },
  {
    title: "Brands",
    paragraphs: [
      "Brands has two tabs: \"Deals\" (your collaborations CRM) and \"Site carousel\" (the logos shown on your public site).",
      "In Deals, each brand can have a status (Prospect, Negotiating, Active, Completed), contact, deal value, package, platforms, next step with a due date, payment status and notes. Tap a brand in the list to see its details; from there you change the status or payment with one tap.",
      "The deal history fills itself in when you change the status or payment, and you can also add entries by hand (e.g. \"Brand counter-offer: $800\"). Adding one also updates the last contact date.",
      "Deal data (value, contact, notes) is private: it never shows on the public site. A new brand created as a deal stays hidden from the carousel until you check \"Show the logo in the carousel\".",
      "Next steps and payments show up in the Summary, flagged when something is overdue.",
      "In each deal you can list the deliverables (e.g. \"30 s reel\" due October 15), mark where each one is (to do, draft, in review, approved, published), reorder them with ↑ ↓ and save the delivery link. We email you 2 days before each due date.",
      "When editing a deal you can also note the usage rights (how long the brand can use your content and from when), exclusivity and whether it includes whitelisting. 7 days before the rights expire we let you know by email and in the Overview, so you can charge for a renewal.",
      "Not sure what to charge? Tap \"💰 What should I charge?\" (at the top of Brands or next to the deal value). Pick the platform, format, quantity, usage rights, exclusivity and whitelisting, and you'll see a low, fair and high range based on your followers, views and engagement. \"Use\" fills in the deal value (and the package, if it was empty).",
      "In Site carousel you reorder logos with ↑ ↓ and choose which ones are shown or hidden (without deleting them).",
      "You can also create a new brand without leaving Feed: when adding a \"Portfolio photo\" card, the brand dropdown has a \"+ add new brand\" option (name + logo).",
    ],
  },
  {
    title: "Connect accounts",
    paragraphs: [
      "In Business → Connect accounts you connect Instagram, Facebook, TikTok and YouTube with their official login (each network's own \"Sign in with…\" button). The panel never sees your password.",
      "After connecting, tap \"Test\": the panel asks the network for your profile and your 6 most recent posts, and shows you what it answered or the exact error.",
      "Each card explains what can and can't be done with that network (for example, TikTok doesn't allow reading DMs). \"Disconnect\" deletes the permissions saved in the panel.",
      "At the bottom is the AI test (Claude), which will be used to suggest captions.",
      "If a network says \"Not configured\", its developer app keys are missing: whoever manages the site sets that up (guide in docs/conectar-cuentas.md).",
    ],
  },
  {
    title: "Goals & plan",
    paragraphs: [
      "Create goals with a current value and a target (e.g. \"Publish 25 pieces this month\"). The bar shows your progress and the top shows the average of all your goals, next to a different motivational phrase every day.",
      "Some goals update themselves: Instagram, TikTok, YouTube or Facebook followers (if you connected the network) and Feed posts this month. You adjust manual ones with the − and + buttons.",
      "The action plan is your task list for the week: check them off when done. If tasks are left over from previous weeks, the panel offers to bring them into the current week.",
    ],
  },
  {
    title: "Log",
    paragraphs: [
      "The milestones line keeps your achievements (\"First paid collaboration\") and your learnings (\"Agreeing the brief in writing avoids rework\").",
      "The content journal is for a short reflection every week: what worked, what didn't and what you'll try next.",
      "The streak counts the consecutive days you did something: a log entry, a completed plan task or a new Feed post. You also see it in the Summary.",
    ],
  },
  {
    title: "Create post",
    paragraphs: [
      "Pick the type (post, carousel, reel, long video or story), which networks it goes to and whether it's for a brand. Write the caption or tap \"Suggest with AI\": the AI gives you 3 options using the topic, the brand and your style; tap the one you like to use it.",
      "While you write you see a preview per network and, on the right, AI tips to execute it on each one. It also warns you if you go over a network's character or hashtag limit.",
      "If the post is for a brand, we check that the text says it's an ad and that it shows before \"more\" (in the first ~100 to 125 characters, depending on the network). If it's missing, tap \"Add #ad at the start\"; if it's too far down, \"Move the disclosure to the start\". #collab or #colaboración alone aren't enough. In the Calendar we flag with ⚠ the ones that don't have it yet. Also use each network's paid partnership label. It's a reference guide (US FTC), not legal advice.",
      "Pick the day and time and tap \"Schedule\" (or save it as a draft). For now it doesn't publish itself: you see it in the Calendar and the Summary so you can upload it that day.",
    ],
  },
  {
    title: "Calendar",
    paragraphs: [
      "Month view with colored dots per network on each day that has something scheduled. Tap a day to see what's there and schedule something new that day.",
      "When you upload the post, tap \"Mark published\". If one is past its date and you didn't mark it, it shows up at the top under \"Did you publish them?\". Marking posts also adds to your streak.",
    ],
  },
  {
    title: "Feed metrics",
    paragraphs: [
      "Each Feed card shows 4 numbers: views, likes, comments and engagement. Engagement is calculated automatically: (likes + comments + shares + saves) ÷ views.",
      "Tap \"Metrics\" on a card to type the numbers by hand and the featured comment (\"What people say\"), with who said it. You can also hide that piece's metrics on the public site.",
      "If you connected Instagram or TikTok, the \"↻ Sync metrics\" button brings in your posts' numbers (it finds them by each card's link). Instagram doesn't provide views yet; type those by hand.",
      "On cards with a brand, \"☆ Feature\" picks which pieces show in the site's Collaborations section (up to 3 per brand). If you feature none, that brand's first ones are shown.",
    ],
  },
  {
    title: "Public view",
    paragraphs: [
      "Shows your site exactly as a brand sees it, inside the panel. You can view it in desktop or phone mode, in Spanish or English.",
    ],
  },
  {
    title: "My domain",
    paragraphs: [
      "See the address of your site to share with brands (with a copy button) and your other addresses: your Foliocrew subdomain (yourname.foliocrew.pro) and the temporary address.",
      "To use your own domain (for example, yourname.com), buy it wherever you like, type it here and tap \"Connect domain\". The panel shows the exact DNS record (type, name and value) to add at your provider. Then tap \"Check now\": once it says \"Connected ✓\", your site is live on your domain with HTTPS. DNS changes can take up to 48 h.",
    ],
  },
  {
    title: "Appearance",
    paragraphs: [
      "Your photo, name, bio (in Spanish and English) and accent color. Pick one of 6 colors (lilac, pink, terracotta, sage, blue or gold) and check the preview before saving. The color changes the buttons, links and details across the whole site and this panel too.",
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
    title: "Inbox",
    paragraphs: [
      "Everything people write to you in one place: contact-form messages from the site and, if you connected Instagram, the comments on your latest posts. Filter with the chips at the top: All, To reply, Form or Instagram.",
      "Each message shows whether it's Pending or Replied. If the sender is a brand in your CRM, you'll see a \"Client\" tag. If a form message has gone more than 24 h without a reply, you'll get a heads-up: brands usually go with whoever answers first.",
      "Form: tap \"Reply\", pick a quick reply (for example, the one with your media kit link) or write your own, and tap \"Open in my email\". Your email app opens with everything ready to send, and the message is marked as replied.",
      "Instagram: your reply is posted right on the comment. You can also hide a comment (only you and its author can see it) or delete it.",
      "Direct messages (DMs) are coming later: they need Meta's review.",
    ],
  },
  {
    title: "Agreements",
    paragraphs: [
      "An agreement (simple contract) puts in writing what you deliver, how much you're paid, the deposit, usage rights, exclusivity, revisions and cancellation, before you start. That cuts down on brands that disappear after you post.",
      "Create it from Agreements → \"+ New agreement\" or from a deal in Brands (\"Create agreement\"). Pick the template (sponsored post, UGC not posted, monthly ambassador or affiliate), fill in the blanks and see the text on the right. If you come from a deal, it's filled in with its amount, deliverables and usage rights.",
      "It's saved as a draft. Tap \"Send to the brand\": they get an email with a link. The brand reads it, types their name and email and accepts it. Their name, email, date, time and IP address are recorded, and you both get a copy by email. The deal switches to \"Active\" on its own.",
      "If the brand asks for changes, we let you know with what they wrote: tap it to edit and resend. An accepted agreement can no longer be changed. It's a reference template: Foliocrew is not a law firm, and for large agreements a lawyer should review it.",
    ],
  },
  {
    title: "Invoices",
    paragraphs: [
      "First fill in your billing details (at the bottom of Invoices): the name on the invoice, your city, how you get paid (PayPal, Zelle…), payment terms and deposit %. Never include your social security number or full account numbers.",
      "Create an invoice from Invoices → \"+ New invoice\", or from a deal in Brands (\"Create invoice\", \"Deposit invoice\" or \"Balance invoice\"): it fills itself in with the brand, contact, package and amount.",
      "It's saved as a draft. When it's ready, tap \"Send to the brand\": they get an email with a link where they can view it, download it as a PDF and tell you \"We paid\". We let you know when they open it and when they say they paid.",
      "If it's late, we send friendly reminders on the due date and at 7 and 14 days (3 at most). When the money arrives, tap \"Mark as paid\": once all of a deal's invoices are paid, the deal switches to \"Paid\" on its own.",
    ],
  },
  {
    title: "Reports",
    paragraphs: [
      "Your growth in numbers: total followers and last-30-days growth, average engagement, posts this month, a month-by-month follower chart, the best day and time to post (based on the engagement of your posts with a date and metrics) and your revenue by brand.",
      "\"Actualizar desde redes conectadas\" (refresh from connected networks) saves today's followers for each connected network. Networks that aren't connected can be entered by hand. Under \"Reporte mensual (PDF)\", pick the month and tap \"Ver reporte\": choose \"Save as PDF\" when printing and send it to a brand.",
      "Your public media kit lives at /media-kit: copy the link from Reports (\"Copiar enlace\") and put it in your bio or emails.",
    ],
  },
  {
    title: "Community",
    paragraphs: [
      "The Community is a wall just for Foliocrew accounts, with every kind of creator (YouTube, TikTok, Instagram, podcast, streaming, UGC, photography…). The first time, you review your profile (it's already built from your details) and accept the rules.",
      "You can post a question, a tip, a win, a collab request or a resource. Filter the wall by type, topic or creator type, and use \"Top\" to see what's helping most.",
      "Mark \"💡 Helpful\" on what helps you and, if you asked, pick the \"Best answer\": that way whoever helps earns points and levels up. We email you when someone replies (you can turn it off in My profile).",
      "If something breaks the rules, tap \"Report\" (it's anonymous). You can also block someone from their profile. Every week the team pins a question to talk about.",
      "To connect with someone, open their profile and tap \"+ Connect\" (you can add a note). Requests you receive are in Community → Connections, where you accept or decline them. Declining is discreet: the other person isn't notified.",
      "You can message your connections in Community → Messages (or with \"💬 Message\" on their profile). New messages show up on their own every few seconds, and we also email you. They're private: nobody on the team reads them unless someone reports a message.",
      "Looking for someone to collab with? In Community → Find creators, filter by platform, niche, city or language, or check \"Only open to collabs\". To show up there with that badge, turn on \"Open to collabs\" in My profile.",
    ],
  },
];

export const MANUAL = {
  es: { primeraVez: primeraVezEs, glosario: glosarioEs, reels: reelsEs, guia: guiaEs },
  en: { primeraVez: primeraVezEn, glosario: glosarioEn, reels: reelsEn, guia: guiaEn },
};
