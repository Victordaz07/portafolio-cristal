import type { Locale } from "@/lib/i18n";

// Textos de las páginas legales (privacidad, términos y borrado de datos), en español e inglés.
// Las redes (Meta, TikTok, Google) exigen estas páginas públicas para aprobar la app.
// Nota: es una base razonable, no asesoría legal; conviene que la revise un abogado.

export type LegalPageId = "privacy" | "terms" | "deletion";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalPage {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export interface LegalContext {
  platformName: string;
  legalOwner: string;
  legalEmail: string;
  updatedAt: string;
}

const GOOGLE_PRIVACY = "https://policies.google.com/privacy";
const GOOGLE_PERMISSIONS = "https://myaccount.google.com/permissions";
const GOOGLE_API_POLICY = "https://developers.google.com/terms/api-services-user-data-policy";
const YOUTUBE_TERMS = "https://www.youtube.com/t/terms";

export function getLegalPage(id: LegalPageId, locale: Locale, ctx: LegalContext): LegalPage {
  return (locale === "en" ? EN : ES)[id](ctx);
}

const ES: Record<LegalPageId, (ctx: LegalContext) => LegalPage> = {
  privacy: ({ platformName, legalOwner, legalEmail }) => ({
    title: "Política de privacidad",
    intro: `${platformName} es una plataforma para que creadores de contenido publiquen su portafolio y administren su trabajo con marcas. Esta política explica qué datos tratamos, para qué y cómo puedes controlarlos. El responsable es ${legalOwner} (${legalEmail}).`,
    sections: [
      {
        heading: "1. Datos que tratamos",
        list: [
          "Visitantes del portafolio: si usas el formulario de contacto o solicitas un paquete, guardamos tu nombre, marca, correo, tipo de colaboración o paquete, fechas y presupuesto aproximado (si los pones) y tu mensaje.",
          "Personas que usan el panel: correo de acceso y el contenido que cargan (textos, fotos, videos, marcas, notas de tratos).",
          "Cuentas de redes sociales conectadas (Instagram, Facebook, TikTok, YouTube), solo si la persona usuaria decide conectarlas: identificador de la cuenta, nombre de usuario, foto de perfil, número de seguidores, publicaciones y sus métricas (vistas, likes, comentarios) y los tokens de acceso que entrega cada red.",
          "Acuerdos con marcas: cuando una marca acepta un acuerdo en línea, guardamos su nombre, correo, fecha, hora y dirección IP como constancia de que lo aceptó, y se la mostramos a la persona creadora y a la marca.",
          "Comunidad (solo dentro del panel): el perfil de comunidad que cada persona elige mostrar, sus publicaciones, respuestas, conexiones y mensajes privados. Los mensajes privados solo los ven las dos personas de la conversación; el equipo solo revisa un mensaje si alguien lo reporta.",
          "Cookies técnicas: idioma elegido y sesión del panel. Si llegas por el enlace de una embajadora de Foliocrew, guardamos su código de invitación en una cookie durante 30 días, solo para dejarte crear tu cuenta y saber quién te invitó. No usamos cookies de publicidad ni de rastreo.",
        ],
      },
      {
        heading: "2. Para qué los usamos",
        list: [
          "Mostrar el portafolio público de cada persona usuaria.",
          "Responder a las marcas que escriben por el formulario.",
          "Mostrar a la persona usuaria, dentro de su panel privado, sus propias métricas y publicaciones, y ayudarla a gestionar comentarios, mensajes y publicaciones en sus cuentas cuando ella lo pide.",
          "Generar sugerencias de texto con inteligencia artificial cuando la persona usuaria lo solicita.",
          "Inteligencia de nicho (solo si la persona usuaria decide sumarse desde su panel): usamos sus métricas de publicaciones, de forma agregada y anónima, para calcular qué funciona en cada nicho (mejores horarios, formatos y tipos de gancho). Solo se muestran resultados de grupos de al menos 3 cuentas, nunca nombres, usuarios ni marcas, y se puede dejar de participar en cualquier momento. Los datos de YouTube no se usan para esto.",
          "Avisos en el celular (cuando están activos): si los activas en un dispositivo, guardamos la dirección que te da tu navegador para enviarte avisos y las llaves para cifrarlos, el tipo de aviso que elegiste y el navegador desde el que los activaste. Los avisos pasan por el servicio de notificaciones de tu navegador (Google, Mozilla, Apple o Microsoft), son cortos y sin datos sensibles. Puedes desactivarlos cuando quieras y los borramos si el dispositivo deja de existir.",
          "Reciclar con IA: el texto que pegas (o la publicación que eliges) se envía a Claude (Anthropic) solo para generar las versiones que pediste; no lo guardamos en Foliocrew, solo el resultado que decides guardar en tu banco de contenido.",
          "Bienestar: guardamos tus ideas del banco de contenido, tus periodos de descanso (fechas, nota y lo que se movió, para poder deshacerlo) y tu límite de carga. Si decides avisar a una marca de tu descanso, el correo sale solo cuando tú lo envías, con el texto que revisaste.",
          "Publicación automática (cuando está activa): si la activas en una pieza, Foliocrew usa el permiso de publicar de tu cuenta de Instagram o de tu página de Facebook para publicar el texto y el archivo que programaste, a la hora elegida, y guarda el resultado (enlace o motivo del error). No publica nada que no hayas programado.",
          "Reseñas de marcas: si escribes una reseña, guardamos tu resultado de pago, los días, tu valoración y tu comentario junto con el identificador de tu cuenta, solo para que no haya dos reseñas tuyas de la misma marca y para moderar. Las demás cuentas nunca ven quién la escribió, y una marca solo se muestra con reseñas de al menos 3 personas distintas. Puedes borrar tu reseña cuando quieras.",
          "Comentario → DM (cuando está activo): si creas una regla, guardamos la palabra y el mensaje, y el usuario de quien comenta y el id del comentario solo para no responder dos veces a la misma persona. Solo se le responde a quien comentó y no se usa para otra cosa.",
          "Finanzas de tu negocio: las facturas, los ingresos y los gastos que registras (con la foto del recibo si la subes) se guardan en tu cuenta para que los veas y los descargues; no pedimos números de identificación fiscal ni datos bancarios.",
          "Soporte y operación: quien administra la plataforma puede ver los datos de una cuenta para dar soporte, resolver problemas, prevenir abusos y medir el uso del servicio.",
        ],
        paragraphs: [
          "No vendemos datos, no los usamos para publicidad y no los compartimos con terceros fuera de los proveedores que necesitamos para operar (ver punto 4).",
        ],
      },
      {
        heading: "3. Datos de redes sociales",
        paragraphs: [
          "Solo accedemos a las cuentas que la persona usuaria conecta con el inicio de sesión oficial de cada red, y solo con los permisos que ella aprueba en esa pantalla. Nunca vemos su contraseña.",
          "Los tokens de acceso se guardan cifrados (AES-256) y nunca se muestran en el sitio público. Las métricas y publicaciones obtenidas solo se ven en el panel privado de la persona usuaria, salvo que ella decida mostrarlas en su portafolio.",
          `Uso de datos de YouTube: ${platformName} usa los servicios de la API de YouTube. Al conectar YouTube aceptas los Términos de servicio de YouTube (${YOUTUBE_TERMS}), y aplica también la Política de privacidad de Google (${GOOGLE_PRIVACY}). El uso de la información recibida de las APIs de Google cumple con la Política de datos de usuario de los servicios de API de Google (${GOOGLE_API_POLICY}), incluidos los requisitos de uso limitado. Puedes revocar el acceso en cualquier momento desde ${GOOGLE_PERMISSIONS}.`,
        ],
      },
      {
        heading: "4. Proveedores que usamos",
        list: [
          "Vercel (alojamiento del sitio y almacenamiento de archivos).",
          "Neon (base de datos PostgreSQL).",
          "Resend (envío de correos del formulario, si está activo).",
          "Anthropic (inteligencia artificial para sugerencias de texto; recibe el texto que la persona usuaria pide procesar y, para la inteligencia de nicho, fragmentos de captions sin usuarios, enlaces ni correos junto con sus métricas). Anthropic no usa estos datos para entrenar sus modelos.",
          "Meta, TikTok y Google (solo para las cuentas que la persona usuaria conecta).",
        ],
      },
      {
        heading: "5. Cuánto tiempo los guardamos",
        paragraphs: [
          "Los datos se guardan mientras la persona usuaria use la plataforma. Al desconectar una red, borramos sus tokens de inmediato. Los mensajes del formulario se guardan hasta que la persona usuaria los borra o pide eliminarlos.",
        ],
      },
      {
        heading: "6. Tus derechos",
        paragraphs: [
          `Puedes pedir acceso, corrección o eliminación de tus datos escribiendo a ${legalEmail}. Respondemos en un plazo máximo de 30 días. Las instrucciones para borrar datos de redes sociales están en la página "Eliminación de datos".`,
        ],
      },
      {
        heading: "7. Seguridad",
        paragraphs: [
          "Usamos conexiones cifradas (HTTPS), tokens cifrados en la base de datos y acceso al panel con contraseña. Ningún sistema es 100% seguro, pero aplicamos medidas razonables para proteger la información.",
        ],
      },
      {
        heading: "8. Menores de edad",
        paragraphs: ["La plataforma no está dirigida a menores de 13 años y no recopilamos datos de ellos a sabiendas."],
      },
      {
        heading: "9. Cambios",
        paragraphs: ["Si cambiamos esta política, actualizaremos la fecha de esta página."],
      },
    ],
  }),
  terms: ({ platformName, legalOwner, legalEmail }) => ({
    title: "Términos de servicio",
    intro: `Estos términos regulan el uso de ${platformName}, operado por ${legalOwner}. Al usar el sitio o el panel aceptas estos términos.`,
    sections: [
      {
        heading: "1. El servicio",
        paragraphs: [
          `${platformName} ofrece un portafolio público para creadores de contenido y un panel privado para administrarlo, organizar colaboraciones con marcas y, si la persona usuaria lo decide, conectar sus redes sociales para ver métricas y gestionar contenido.`,
        ],
      },
      {
        heading: "2. Cuentas y acceso",
        list: [
          "Cada persona usuaria es responsable de mantener segura su contraseña.",
          "Solo puedes conectar redes sociales que te pertenecen o que estás autorizada a administrar.",
          "Podemos suspender cuentas que infrinjan estos términos o las reglas de las redes conectadas.",
        ],
      },
      {
        heading: "3. Tu contenido",
        paragraphs: [
          "El contenido que subes (fotos, videos, textos) sigue siendo tuyo. Nos das permiso para guardarlo y mostrarlo en tu portafolio con el único fin de prestar el servicio.",
          "Eres responsable de tener los derechos sobre lo que publicas, incluidos logos y menciones de marcas.",
          "Tienda: si vendes productos, asesorías o recomiendas enlaces de afiliado desde tu tienda, la venta es entre tú y tu cliente. Foliocrew no cobra comisión, no procesa esos pagos ni guarda tus archivos digitales; eres responsable del cobro, de la entrega, de los reembolsos, de los impuestos y de avisar cuando un enlace es de afiliado.",
        ],
      },
      {
        heading: "4. Redes sociales de terceros",
        paragraphs: [
          `Al conectar una red aceptas también sus propios términos: Instagram y Facebook (Meta), TikTok y YouTube (${YOUTUBE_TERMS}). ${platformName} no está afiliado a Meta, TikTok ni Google. Las funciones disponibles dependen de lo que cada red permite y pueden cambiar sin aviso.`,
        ],
      },
      {
        heading: "5. Uso aceptable",
        list: [
          "No usar la plataforma para spam, contenido ilegal, engañoso o que infrinja derechos de terceros.",
          "No intentar acceder a cuentas o datos de otras personas.",
          "No automatizar acciones que violen las reglas de las redes conectadas.",
        ],
      },
      {
        heading: "6. Inteligencia artificial",
        paragraphs: [
          "Las sugerencias generadas con IA son un punto de partida. Revisa siempre el texto antes de publicarlo; eres responsable de lo que publicas.",
        ],
      },
      {
        heading: "7. Disponibilidad y responsabilidad",
        paragraphs: [
          "Hacemos lo posible para que el servicio funcione siempre, pero se ofrece \"tal cual\", sin garantías de disponibilidad continua. No somos responsables de pérdidas indirectas, ni de fallas o cambios de las redes de terceros.",
        ],
      },
      {
        heading: "8. Planes y pagos",
        list: [
          "Las cuentas nuevas pueden tener un período de prueba gratis. Al terminar, para seguir usando el servicio hay que pagar un plan.",
          "Por ahora los pagos son manuales, por PayPal o transferencia bancaria, en dólares estadounidenses (USD), por 1, 3 o 12 meses. No hay renovación automática: avisamos por correo antes del vencimiento.",
          "El plan queda activo cuando confirmamos que recibimos el pago. Incluye tu referencia en el concepto para identificarlo.",
          "Si el plan vence, tus datos se conservan. Podemos pausar el sitio y el panel de las cuentas vencidas hasta que se renueven.",
          `Los pagos no son reembolsables, salvo error nuestro o cobro duplicado. Si tienes un problema con un pago, escríbenos a ${legalEmail}.`,
          "Los precios pueden cambiar; los cambios no afectan los períodos que ya pagaste.",
        ],
      },
      {
        heading: "9. Cambios y contacto",
        paragraphs: [
          `Podemos actualizar estos términos; la fecha de esta página indica la versión vigente. Dudas: ${legalEmail}.`,
        ],
      },
    ],
  }),
  deletion: ({ platformName, legalEmail }) => ({
    title: "Eliminación de datos",
    intro: `Cómo borrar los datos que ${platformName} guarda sobre ti o sobre tus cuentas de redes sociales.`,
    sections: [
      {
        heading: "Si creas contenido y conectaste una red",
        list: [
          "Entra a tu panel → Negocio → Conectar cuentas → \"Desconectar\" en la red que quieras. Borramos de inmediato los tokens de acceso de esa red.",
          "Para quitar también el permiso desde la red: Instagram → Configuración → Apps y sitios web; Facebook → Configuración → Integraciones empresariales; TikTok → Configuración y privacidad → Seguridad → Apps y servicios; Google → " + GOOGLE_PERMISSIONS + ".",
          "Para borrar también tus métricas y publicaciones guardadas, o tu cuenta completa, escríbenos (ver abajo).",
        ],
      },
      {
        heading: "Si escribiste por el formulario de contacto",
        paragraphs: ["Escríbenos desde el mismo correo y borraremos tu mensaje y tus datos de contacto."],
      },
      {
        heading: "Cómo pedirlo",
        paragraphs: [
          `Envía un correo a ${legalEmail} con el asunto "Eliminar mis datos", indicando tu nombre y la cuenta o correo afectado. Confirmamos la eliminación en un plazo máximo de 30 días.`,
        ],
      },
    ],
  }),
};

const EN: Record<LegalPageId, (ctx: LegalContext) => LegalPage> = {
  privacy: ({ platformName, legalOwner, legalEmail }) => ({
    title: "Privacy Policy",
    intro: `${platformName} is a platform for content creators to publish their portfolio and manage their work with brands. This policy explains what data we process, why, and how you can control it. The data controller is ${legalOwner} (${legalEmail}).`,
    sections: [
      {
        heading: "1. Data we process",
        list: [
          "Portfolio visitors: if you use the contact form or request a package, we store your name, brand, email, collaboration type or package, dates and approximate budget (if you add them) and your message.",
          "Creators using the dashboard: login email and the content they upload (texts, photos, videos, brands, deal notes).",
          "Connected social media accounts (Instagram, Facebook, TikTok, YouTube), only if the creator chooses to connect them: account ID, username, profile picture, follower count, posts and their metrics (views, likes, comments) and the access tokens issued by each network.",
          "Agreements with brands: when a brand accepts an agreement online, we store its name, email, date, time and IP address as proof of acceptance, and show it to the creator and the brand.",
          "Community (only inside the dashboard): the community profile each person chooses to show, their posts, replies, connections and private messages. Private messages are only visible to the two people in the conversation; the team only reviews a message if someone reports it.",
          "Essential cookies: chosen language and dashboard session. If you arrive through a Foliocrew ambassador's link, we store their invitation code in a cookie for 30 days, only so you can create your account and we know who invited you. We do not use advertising or tracking cookies.",
        ],
      },
      {
        heading: "2. How we use it",
        list: [
          "To display each creator's public portfolio.",
          "To reply to brands that write through the contact form.",
          "To show creators, inside their private dashboard, their own metrics and posts, and to help them manage comments, messages and posts on their accounts when they request it.",
          "To generate AI text suggestions when the creator asks for them.",
          "Niche intelligence (only if the creator opts in from their dashboard): we use their post metrics, aggregated and anonymized, to work out what performs best in each niche (best times, formats and hook types). Only results from groups of at least 3 accounts are shown, never names, usernames or brands, and creators can opt out at any time. YouTube data is not used for this.",
          "Phone notices (when active): if you turn them on for a device, we store the address your browser gives us to send you notices and the keys to encrypt them, the notice topics you chose and the browser you turned them on from. Notices go through your browser's notification service (Google, Mozilla, Apple or Microsoft), are short and contain no sensitive data. You can turn them off any time and we delete them if the device stops existing.",
          "Recycle with AI: the text you paste (or the post you choose) is sent to Claude (Anthropic) only to generate the versions you asked for; we don't keep it in Foliocrew, only the result you choose to save to your content bank.",
          "Wellbeing: we store your content bank ideas, your rest periods (dates, note and what was moved, so it can be undone) and your workload limit. If you decide to let a brand know about your break, the email is only sent when you send it, with the text you reviewed.",
          "Automatic publishing (when active): if you turn it on for a post, Foliocrew uses the publishing permission of your Instagram account or Facebook page to publish the text and file you scheduled, at the chosen time, and stores the result (link or error reason). It doesn't publish anything you haven't scheduled.",
          "Brand reviews: if you write a review, we store your payment outcome, the days, your rating and your comment together with your account identifier, only so there aren't two reviews from you for the same brand and to moderate. Other accounts never see who wrote it, and a brand is only shown with reviews from at least 3 different people. You can delete your review any time.",
          "Comment → DM (when active): if you create a rule, we store the word and the message, plus the commenter's account id and the comment id only so we don't reply to the same person twice. Only the person who commented gets a reply, and it isn't used for anything else.",
          "Your business finances: the invoices, income and expenses you record (with the receipt photo if you upload one) are stored in your account so you can view and download them; we don't ask for tax ID numbers or bank details.",
          "Support and operations: platform administrators may view an account's data to provide support, troubleshoot, prevent abuse and measure use of the service.",
        ],
        paragraphs: [
          "We do not sell data, use it for advertising, or share it with third parties beyond the service providers we need to operate (see section 4).",
        ],
      },
      {
        heading: "3. Social media data",
        paragraphs: [
          "We only access accounts the creator connects through each network's official login, and only with the permissions she approves on that screen. We never see her password.",
          "Access tokens are stored encrypted (AES-256) and are never shown on the public site. Retrieved metrics and posts are only visible in the creator's private dashboard, unless she chooses to show them in her portfolio.",
          `YouTube data: ${platformName} uses YouTube API Services. By connecting YouTube you agree to the YouTube Terms of Service (${YOUTUBE_TERMS}), and the Google Privacy Policy (${GOOGLE_PRIVACY}) also applies. ${platformName}'s use of information received from Google APIs adheres to the Google API Services User Data Policy (${GOOGLE_API_POLICY}), including the Limited Use requirements. You can revoke access at any time at ${GOOGLE_PERMISSIONS}.`,
        ],
      },
      {
        heading: "4. Service providers",
        list: [
          "Vercel (site hosting and file storage).",
          "Neon (PostgreSQL database).",
          "Resend (contact form emails, when enabled).",
          "Anthropic (AI text suggestions; receives the text the creator asks to process and, for niche intelligence, caption excerpts stripped of usernames, links and emails along with their metrics). Anthropic does not use this data to train its models.",
          "Meta, TikTok and Google (only for the accounts the creator connects).",
        ],
      },
      {
        heading: "5. Retention",
        paragraphs: [
          "Data is kept while the creator uses the platform. When a network is disconnected, its tokens are deleted immediately. Contact form messages are kept until the creator deletes them or deletion is requested.",
        ],
      },
      {
        heading: "6. Your rights",
        paragraphs: [
          `You can request access to, correction or deletion of your data by writing to ${legalEmail}. We reply within 30 days. Instructions for deleting social media data are on the "Data Deletion" page.`,
        ],
      },
      {
        heading: "7. Security",
        paragraphs: [
          "We use encrypted connections (HTTPS), encrypted tokens in the database and password-protected dashboard access. No system is 100% secure, but we apply reasonable measures to protect your information.",
        ],
      },
      {
        heading: "8. Children",
        paragraphs: ["The platform is not directed to children under 13 and we do not knowingly collect their data."],
      },
      {
        heading: "9. Changes",
        paragraphs: ["If we change this policy, we will update the date on this page."],
      },
    ],
  }),
  terms: ({ platformName, legalOwner, legalEmail }) => ({
    title: "Terms of Service",
    intro: `These terms govern the use of ${platformName}, operated by ${legalOwner}. By using the site or the dashboard you agree to these terms.`,
    sections: [
      {
        heading: "1. The service",
        paragraphs: [
          `${platformName} provides a public portfolio for content creators and a private dashboard to manage it, organize brand collaborations and, if the creator chooses, connect her social media accounts to view metrics and manage content.`,
        ],
      },
      {
        heading: "2. Accounts and access",
        list: [
          "Each creator is responsible for keeping her password secure.",
          "You may only connect social media accounts you own or are authorized to manage.",
          "We may suspend accounts that violate these terms or the rules of the connected networks.",
        ],
      },
      {
        heading: "3. Your content",
        paragraphs: [
          "Content you upload (photos, videos, texts) remains yours. You grant us permission to store and display it in your portfolio solely to provide the service.",
          "You are responsible for holding the rights to what you publish, including brand logos and mentions.",
          "Shop: if you sell products or consulting calls, or recommend affiliate links from your shop, the sale is between you and your customer. Foliocrew charges no commission, doesn't process those payments and doesn't store your digital files; you are responsible for collecting payment, delivery, refunds, taxes and disclosing when a link is an affiliate link.",
        ],
      },
      {
        heading: "4. Third-party social networks",
        paragraphs: [
          `By connecting a network you also agree to its own terms: Instagram and Facebook (Meta), TikTok and YouTube (${YOUTUBE_TERMS}). ${platformName} is not affiliated with Meta, TikTok or Google. Available features depend on what each network allows and may change without notice.`,
        ],
      },
      {
        heading: "5. Acceptable use",
        list: [
          "Do not use the platform for spam, or for illegal, misleading or infringing content.",
          "Do not attempt to access other people's accounts or data.",
          "Do not automate actions that violate the rules of the connected networks.",
        ],
      },
      {
        heading: "6. Artificial intelligence",
        paragraphs: [
          "AI-generated suggestions are a starting point. Always review the text before publishing; you are responsible for what you publish.",
        ],
      },
      {
        heading: "7. Availability and liability",
        paragraphs: [
          "We do our best to keep the service running, but it is provided \"as is\", without guarantees of uninterrupted availability. We are not liable for indirect losses, nor for failures or changes of third-party networks.",
        ],
      },
      {
        heading: "8. Plans and payments",
        list: [
          "New accounts may include a free trial. When it ends, a paid plan is required to keep using the service.",
          "For now payments are manual, via PayPal or bank transfer, in US dollars (USD), for 1, 3 or 12 months. There is no automatic renewal: we email you before your plan expires.",
          "Your plan becomes active once we confirm we received the payment. Include your reference in the payment note so we can identify it.",
          "If your plan expires, your data is kept. We may pause the site and dashboard of expired accounts until they renew.",
          `Payments are non-refundable, except in case of our error or a duplicate charge. If you have a problem with a payment, write to ${legalEmail}.`,
          "Prices may change; changes do not affect periods you have already paid for.",
        ],
      },
      {
        heading: "9. Changes and contact",
        paragraphs: [
          `We may update these terms; the date on this page shows the current version. Questions: ${legalEmail}.`,
        ],
      },
    ],
  }),
  deletion: ({ platformName, legalEmail }) => ({
    title: "Data Deletion",
    intro: `How to delete the data ${platformName} stores about you or your social media accounts.`,
    sections: [
      {
        heading: "If you are a creator and connected a network",
        list: [
          "Go to your dashboard → Business → Connect accounts → \"Disconnect\" on the network you want. We immediately delete that network's access tokens.",
          "To also remove the permission on the network side: Instagram → Settings → Apps and websites; Facebook → Settings → Business integrations; TikTok → Settings and privacy → Security → Apps and services; Google → " + GOOGLE_PERMISSIONS + ".",
          "To also delete your stored metrics and posts, or your whole account, email us (see below).",
        ],
      },
      {
        heading: "If you wrote through the contact form",
        paragraphs: ["Email us from the same address and we will delete your message and contact details."],
      },
      {
        heading: "How to request it",
        paragraphs: [
          `Send an email to ${legalEmail} with the subject "Delete my data", including your name and the affected account or email. We confirm deletion within 30 days.`,
        ],
      },
    ],
  }),
};
