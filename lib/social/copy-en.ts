// Textos de las redes (qué se puede hacer, resultados de la prueba) en inglés, para el panel en inglés.
// La clave es el texto en español de lib/social/providers.ts.
import type { AdminLang } from "../admin-lang";

const EN: Record<string, string> = {
  // Instagram
  "Leer tu perfil, seguidores y publicaciones con sus likes y comentarios": "Read your profile, followers and posts with their likes and comments",
  "Leer, responder, ocultar y borrar comentarios": "Read, reply to, hide and delete comments",
  "Leer y responder DMs (hasta 24 h después del último mensaje de la persona)": "Read and reply to DMs (up to 24 h after the person's last message)",
  "Publicar fotos, carruseles, Reels e Historias (hasta 100 por día)": "Publish photos, carousels, Reels and Stories (up to 100 per day)",
  "Métricas avanzadas: alcance, vistas, guardados, compartidos y público por edad, país y género": "Advanced insights: reach, views, saves, shares and audience by age, country and gender",
  "Ver cuándo otras cuentas te mencionan": "See when other accounts mention you",
  "Usar la música de Instagram (el audio va dentro del video)": "Use Instagram music (the audio must be inside the video)",
  "Editar el texto o la foto de algo ya publicado": "Edit the text or photo of something already published",
  "Ver la lista de seguidores o las métricas privadas de otras cuentas": "See the follower list or private metrics of other accounts",
  "Escribir primero por DM a alguien que nunca te escribió": "DM someone first who never wrote to you",
  "Usarse con otras cuentas sin la revisión de Meta (en modo desarrollo solo tú y tus testers)": "Be used with other accounts without Meta's review (in development mode only you and your testers)",
  // Facebook
  "Listar tus páginas de Facebook y sus seguidores": "List your Facebook Pages and their followers",
  "Leer las publicaciones recientes de tu página": "Read your Page's recent posts",
  "Publicar y programar posts, fotos, videos y Reels en la página": "Publish and schedule posts, photos, videos and Reels on the Page",
  "Métricas de la página: alcance, interacciones y seguidores": "Page insights: reach, engagement and followers",
  "Responder y ocultar comentarios": "Reply to and hide comments",
  "Responder mensajes de Messenger (hasta 24 h después del último mensaje)": "Reply to Messenger messages (up to 24 h after the last message)",
  "Publicar o leer un perfil personal (solo páginas)": "Publish to or read a personal profile (Pages only)",
  "Usar la música de Facebook": "Use Facebook music",
  "Escribir primero por Messenger a quien no te escribió": "Message someone first on Messenger who didn't write to you",
  // TikTok
  "Leer tu perfil, seguidores y likes totales": "Read your profile, followers and total likes",
  "Listar tus videos con vistas, likes y comentarios": "List your videos with views, likes and comments",
  "Publicar videos y fotos (en privado hasta que TikTok apruebe la app)": "Publish videos and photos (private until TikTok approves the app)",
  "Mandar un video como borrador a la app de TikTok para agregarle sonido y publicarlo allá": "Send a video as a draft to the TikTok app to add sound and publish it there",
  "Solo con cuenta Business y aprobación de TikTok for Business: leer y responder comentarios y ver métricas avanzadas": "Business accounts with TikTok for Business approval only: read and reply to comments and see advanced insights",
  "Leer ni responder DMs (TikTok no los ofrece a creadores)": "Read or reply to DMs (TikTok doesn't offer them to creators)",
  "Responder comentarios con cuenta Creator (solo con cuenta Business)": "Reply to comments with a Creator account (Business accounts only)",
  "Usar la música de TikTok desde la API": "Use TikTok music through the API",
  "Publicar más de ~15 veces al día": "Publish more than ~15 times a day",
  "Usarse con otras cuentas mientras la app esté en Sandbox (solo cuentas de prueba)": "Be used with other accounts while the app is in Sandbox (test accounts only)",
  // YouTube
  "Leer tu canal, suscriptores y total de vistas": "Read your channel, subscribers and total views",
  "Listar tus videos recientes con vistas, likes y comentarios": "List your recent videos with views, likes and comments",
  "Subir y programar videos y Shorts (en privado hasta que Google apruebe la app)": "Upload and schedule videos and Shorts (private until Google approves the app)",
  "Editar título, descripción, miniatura y listas de reproducción": "Edit title, description, thumbnail and playlists",
  "Responder y moderar comentarios": "Reply to and moderate comments",
  "Estadísticas avanzadas: tiempo de visualización, retención, público y ganancias": "Advanced analytics: watch time, retention, audience and earnings",
  "Publicaciones de comunidad ni DMs (YouTube no tiene)": "Community posts or DMs (YouTube doesn't have them)",
  "Usar la música de YouTube": "Use YouTube music",
  'Mantener la conexión más de 7 días mientras la app de Google esté en modo "Testing"': 'Keep the connection longer than 7 days while the Google app is in "Testing" mode',
  // Resultados de la prueba
  "Tipo de cuenta": "Account type",
  "Páginas con acceso": "Pages with access",
  "Página principal": "Main Page",
  "Ninguna — revisa que elegiste tu página al conectar": "None — make sure you picked your Page when connecting",
  Siguiendo: "Following",
  "Likes totales": "Total likes",
  "Vistas totales": "Total views",
  Videos: "Videos",
  Vistas: "Views",
  Likes: "Likes",
  Comentarios: "Comments",
  "Instagram no está conectado": "Instagram isn't connected",
  "Esta cuenta de Google no tiene un canal de YouTube": "This Google account has no YouTube channel",
};

/** Texto de una red en el idioma del panel (si no hay traducción, queda igual). */
export function socialCopy(lang: AdminLang, text: string) {
  return lang === "en" ? EN[text] ?? text : text;
}

export function socialCopyList(lang: AdminLang, list: string[]) {
  return list.map((text) => socialCopy(lang, text));
}

/** Errores guardados de las redes (lastError) en el idioma del panel. */
const ERROR_PATTERNS: [RegExp, string][] = [
  [/^El token ya no es válido; vuelve a conectar la cuenta \(Meta, código 190: (.*)\)$/, "The token is no longer valid; reconnect the account (Meta, code 190: $1)"],
  [/^Falta la variable de entorno (.*)$/, "The environment variable $1 is missing"],
  [/^Error de la API$/, "API error"],
  [/^sin detalle$/, "no details"],
];

export function socialError(lang: AdminLang, message: string) {
  if (lang !== "en") return message;
  for (const [pattern, replacement] of ERROR_PATTERNS) {
    if (pattern.test(message)) return message.replace(pattern, replacement);
  }
  return EN[message] ?? message;
}
