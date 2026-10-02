// Plantillas de correo de Foliocrew: HTML con estilos en línea (lo que aceptan Gmail y Outlook)
// y una versión en texto plano. Todo en español y con lenguaje neutro.

const INK = "#251023";
const PLUM = "#7F207B";
const CREAM = "#FBF7F5";
const LINE = "#EADFE6";

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

interface Layout {
  origin: string;
  preheader: string;
  title: string;
  /** Párrafos en HTML (el texto de usuario ya tiene que venir escapado). */
  body: string[];
  button?: { label: string; url: string };
  /** Nota pequeña bajo el botón. */
  note?: string;
}

function layout({ origin, preheader, title, body, button, note }: Layout) {
  const paragraphs = body
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${INK};">${p}</p>`)
    .join("");
  const cta = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:999px;background:${INK};">
        <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:${CREAM};text-decoration:none;border-radius:999px;">${escapeHtml(button.label)}</a>
      </td></tr></table>
      <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#7a6676;">Si el botón no funciona, copia este enlace:<br><a href="${escapeHtml(button.url)}" style="color:${PLUM};word-break:break-all;">${escapeHtml(button.url)}</a></p>`
    : "";
  const small = note ? `<p style="margin:0;font-size:13px;line-height:1.5;color:#7a6676;">${note}</p>` : "";
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td style="padding:0 0 20px;"><img src="${origin}/brand/logo.png" alt="Foliocrew" width="150" style="display:block;height:auto;border:0;"></td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:20px;padding:32px 28px;">
      <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-style:italic;font-size:26px;line-height:1.25;color:${INK};">${escapeHtml(title)}</h1>
      ${paragraphs}${cta}${small}
    </td></tr>
    <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.5;color:#7a6676;text-align:center;">
      Foliocrew · Tu talento merece su espacio · <a href="${origin}" style="color:${PLUM};">${escapeHtml(origin.replace(/^https?:\/\//, ""))}</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function text(lines: (string | false | undefined)[]) {
  return lines.filter((l) => l !== false && l !== undefined).join("\n\n") + "\n\n— Foliocrew";
}

const first = (name: string | null | undefined) => (name || "").trim().split(/\s+/)[0] || "";
const hello = (name: string | null | undefined) => (first(name) ? `Hola, ${first(name)}:` : "Hola:");

// ─── Cuenta ───

export function welcomeEmail(p: { origin: string; name: string | null; siteUrl: string; panelUrl: string; verifyUrl: string }) {
  const subject = "Tu espacio en Foliocrew está listo";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: "Confirma tu correo y termina tu sitio en 10 minutos.",
      title: "Te damos la bienvenida a Foliocrew",
      body: [
        escapeHtml(hello(p.name)),
        "Tu cuenta ya está creada. Primero confirma tu correo: así podemos avisarte cuando una marca te escriba y ayudarte si olvidas tu contraseña.",
      ],
      button: { label: "Confirmar mi correo", url: p.verifyUrl },
      note: `Tu sitio: <a href="${escapeHtml(p.siteUrl)}" style="color:${PLUM};">${escapeHtml(p.siteUrl)}</a><br>Tu panel: <a href="${escapeHtml(p.panelUrl)}" style="color:${PLUM};">${escapeHtml(p.panelUrl)}</a><br><br>El enlace para confirmar vence en 3 días. Si no creaste esta cuenta, ignora este correo.`,
    }),
    text: text([
      hello(p.name),
      "Tu cuenta de Foliocrew ya está creada. Confirma tu correo con este enlace (vence en 3 días):",
      p.verifyUrl,
      `Tu sitio: ${p.siteUrl}`,
      `Tu panel: ${p.panelUrl}`,
      "Si no creaste esta cuenta, ignora este correo.",
    ]),
  };
}

export function verifyEmail(p: { origin: string; name: string | null; verifyUrl: string }) {
  const subject = "Confirma tu correo de Foliocrew";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: "Un clic y listo.",
      title: "Confirma tu correo",
      body: [escapeHtml(hello(p.name)), "Toca el botón para confirmar que este correo es tuyo."],
      button: { label: "Confirmar mi correo", url: p.verifyUrl },
      note: "El enlace vence en 3 días. Si no lo pediste, ignora este correo.",
    }),
    text: text([hello(p.name), "Confirma tu correo de Foliocrew con este enlace (vence en 3 días):", p.verifyUrl]),
  };
}

export function passwordResetEmail(p: { origin: string; name: string | null; resetUrl: string }) {
  const subject = "Restablece tu contraseña de Foliocrew";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: "El enlace vence en 1 hora.",
      title: "Crea una contraseña nueva",
      body: [
        escapeHtml(hello(p.name)),
        "Alguien (seguramente tú) pidió restablecer la contraseña de tu cuenta de Foliocrew. Toca el botón para elegir una nueva.",
      ],
      button: { label: "Elegir contraseña nueva", url: p.resetUrl },
      note: "El enlace vence en 1 hora y solo funciona una vez. Si no lo pediste, ignora este correo: tu contraseña sigue igual.",
    }),
    text: text([
      hello(p.name),
      "Para elegir una contraseña nueva en Foliocrew, abre este enlace (vence en 1 hora y solo funciona una vez):",
      p.resetUrl,
      "Si no lo pediste, ignora este correo: tu contraseña sigue igual.",
    ]),
  };
}

export function passwordChangedEmail(p: { origin: string; name: string | null; forgotUrl: string }) {
  const subject = "Tu contraseña de Foliocrew cambió";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: "Aviso de seguridad.",
      title: "Tu contraseña cambió",
      body: [
        escapeHtml(hello(p.name)),
        "Te avisamos que la contraseña de tu cuenta de Foliocrew acaba de cambiar. Por seguridad, cerramos las sesiones abiertas en tus otros equipos.",
        `Si no fuiste tú, <a href="${escapeHtml(p.forgotUrl)}" style="color:${PLUM};">restablece tu contraseña ahora</a> y respóndenos este correo.`,
      ],
    }),
    text: text([
      hello(p.name),
      "La contraseña de tu cuenta de Foliocrew acaba de cambiar. Cerramos las sesiones abiertas en tus otros equipos.",
      `Si no fuiste tú, restablécela ahora: ${p.forgotUrl}`,
    ]),
  };
}

// ─── Mensajes de marcas ───

export function brandMessageEmail(p: {
  origin: string;
  creatorName: string | null;
  fromName: string;
  brand: string;
  fromEmail: string;
  collaborationType: string;
  message: string;
  inboxUrl: string;
}) {
  const subject = `Nueva colaboración: ${p.brand} (${p.collaborationType})`;
  const quote = escapeHtml(p.message).replace(/\n/g, "<br>");
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: `${p.fromName} de ${p.brand} te escribió desde tu sitio.`,
      title: "Una marca te escribió",
      body: [
        escapeHtml(hello(p.creatorName)),
        `<strong>${escapeHtml(p.fromName)}</strong> de <strong>${escapeHtml(p.brand)}</strong> te escribió desde tu sitio.<br>Tipo de colaboración: ${escapeHtml(p.collaborationType)}<br>Correo: <a href="mailto:${escapeHtml(p.fromEmail)}" style="color:${PLUM};">${escapeHtml(p.fromEmail)}</a>`,
        `<span style="display:block;border-left:3px solid ${PLUM};padding:4px 0 4px 14px;color:${INK};">${quote}</span>`,
      ],
      button: { label: "Responder desde mi Bandeja", url: p.inboxUrl },
      note: "También puedes responder este correo: le llega directo a la marca.",
    }),
    text: text([
      hello(p.creatorName),
      `${p.fromName} de ${p.brand} te escribió desde tu sitio (${p.collaborationType}).`,
      `Correo: ${p.fromEmail}`,
      p.message,
      `Tu Bandeja: ${p.inboxUrl}`,
    ]),
  };
}

// ─── Lista de espera ───

export function waitlistJoinedEmail(p: { origin: string; position: number; shareUrl: string }) {
  const subject = "Ya estás en la lista de Foliocrew 💜";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: `Tienes el puesto #${p.position}.`,
      title: "¡Ya estás en la lista!",
      body: [
        `Tienes el puesto <strong>#${p.position}</strong>. Estamos abriendo Foliocrew por invitación: quienes se anotan primero entran antes y con precio especial de lanzamiento.`,
        "Foliocrew junta tu portafolio bilingüe, tu media kit, tus marcas y tu calendario en un solo lugar, para que te veas profesional desde el primer día.",
        `¿Conoces a alguien que cree contenido? Pásale este enlace: <a href="${escapeHtml(p.shareUrl)}" style="color:${PLUM};">${escapeHtml(p.shareUrl)}</a>`,
      ],
      note: "Te escribiremos a este correo cuando tengas tu invitación.",
    }),
    text: text([
      `¡Ya estás en la lista de Foliocrew! Tienes el puesto #${p.position}.`,
      "Quienes se anotan primero entran antes y con precio especial de lanzamiento. Te escribiremos cuando tengas tu invitación.",
      `Invita a alguien que cree contenido: ${p.shareUrl}`,
    ]),
  };
}

export function waitlistInviteEmail(p: { origin: string; name: string | null; registerUrl: string; inviteCode: string }) {
  const subject = "Tu invitación a Foliocrew está aquí ✨";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: "Crea tu cuenta y arma tu portafolio en 10 minutos.",
      title: "Te llegó tu invitación",
      body: [
        escapeHtml(hello(p.name)),
        "Ya puedes crear tu cuenta de Foliocrew. El asistente arma tu portafolio bilingüe en unos 10 minutos: foto, bio, tus mejores videos y tu contacto.",
        `Tu código de invitación: <strong style="font-family:monospace;font-size:18px;letter-spacing:1px;">${escapeHtml(p.inviteCode)}</strong>`,
      ],
      button: { label: "Crear mi cuenta", url: p.registerUrl },
      note: "Por favor no compartas el código en público.",
    }),
    text: text([
      hello(p.name),
      "Ya puedes crear tu cuenta de Foliocrew.",
      `Tu código de invitación: ${p.inviteCode}`,
      `Crea tu cuenta aquí: ${p.registerUrl}`,
    ]),
  };
}
