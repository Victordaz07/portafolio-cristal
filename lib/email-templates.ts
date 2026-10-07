// Plantillas de correo de Foliocrew: HTML con estilos en línea (lo que aceptan Gmail y Outlook)
// y una versión en texto plano. En español (lenguaje neutro) o en inglés, según el idioma de quien lo recibe.

export type MailLang = "es" | "en";

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
  lang?: MailLang;
  /** Enlace para darse de baja: va en los correos que no son de una cuenta (lista de espera). */
  unsubscribeUrl?: string;
}

/** Dirección postal del remitente (LEGAL_POSTAL_ADDRESS), en una línea. Sale al pie de todos los correos. */
export function postalAddress() {
  return (process.env.LEGAL_POSTAL_ADDRESS || "").replace(/\s*\n\s*/g, ", ").trim();
}

const unsubscribeLabel = (lang: MailLang) => (lang === "en" ? "Unsubscribe from these emails" : "Darme de baja de estos correos");

function layout({ origin, preheader, title, body, button, note, lang = "es", unsubscribeUrl }: Layout) {
  const en = lang === "en";
  const address = postalAddress();
  const legal = [
    address ? escapeHtml(address) : "",
    unsubscribeUrl ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${PLUM};">${unsubscribeLabel(lang)}</a>` : "",
  ]
    .filter(Boolean)
    .join("<br>");
  const paragraphs = body
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${INK};">${p}</p>`)
    .join("");
  const cta = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:999px;background:${INK};">
        <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:${CREAM};text-decoration:none;border-radius:999px;">${escapeHtml(button.label)}</a>
      </td></tr></table>
      <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#7a6676;">${en ? "If the button doesn't work, copy this link:" : "Si el botón no funciona, copia este enlace:"}<br><a href="${escapeHtml(button.url)}" style="color:${PLUM};word-break:break-all;">${escapeHtml(button.url)}</a></p>`
    : "";
  const small = note ? `<p style="margin:0;font-size:13px;line-height:1.5;color:#7a6676;">${note}</p>` : "";
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
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
      Foliocrew · ${en ? "Your talent deserves its own space" : "Tu talento merece su espacio"} · <a href="${origin}" style="color:${PLUM};">${escapeHtml(origin.replace(/^https?:\/\//, ""))}</a>${legal ? `<br>${legal}` : ""}
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function text(lines: (string | false | undefined)[]) {
  const address = postalAddress();
  return lines.filter((l) => l !== false && l !== undefined).join("\n\n") + "\n\n— Foliocrew" + (address ? `\n${address}` : "");
}

const first = (name: string | null | undefined) => (name || "").trim().split(/\s+/)[0] || "";
const hello = (name: string | null | undefined, lang: MailLang = "es") =>
  lang === "en" ? (first(name) ? `Hi ${first(name)},` : "Hi,") : first(name) ? `Hola, ${first(name)}:` : "Hola:";

// ─── Cuenta ───

export function welcomeEmail(p: { origin: string; name: string | null; siteUrl: string; panelUrl: string; verifyUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return welcomeEmailEn(p);
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

export function verifyEmail(p: { origin: string; name: string | null; verifyUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return verifyEmailEn(p);
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

export function passwordResetEmail(p: { origin: string; name: string | null; resetUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return passwordResetEmailEn(p);
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

export function passwordChangedEmail(p: { origin: string; name: string | null; forgotUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return passwordChangedEmailEn(p);
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

export function emailChangedEmail(p: { origin: string; name: string | null; newEmail: string; lang?: MailLang }) {
  if (p.lang === "en") return emailChangedEmailEn(p);
  const subject = "El correo de tu cuenta de Foliocrew cambió";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: "Aviso de seguridad.",
      title: "Tu correo de acceso cambió",
      body: [
        escapeHtml(hello(p.name)),
        `Te avisamos que tu cuenta de Foliocrew ahora inicia sesión con <strong>${escapeHtml(p.newEmail)}</strong>. Desde ahora los avisos llegan a ese correo.`,
        "Si no fuiste tú ni lo pediste, responde este correo cuanto antes y lo revisamos.",
      ],
    }),
    text: text([
      hello(p.name),
      `Tu cuenta de Foliocrew ahora inicia sesión con ${p.newEmail}. Desde ahora los avisos llegan a ese correo.`,
      "Si no fuiste tú ni lo pediste, responde este correo cuanto antes.",
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
  lang?: MailLang;
}) {
  if (p.lang === "en") return brandMessageEmailEn(p);
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

export function waitlistJoinedEmail(p: { origin: string; position: number; shareUrl: string; unsubscribeUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return waitlistJoinedEmailEn(p);
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
      unsubscribeUrl: p.unsubscribeUrl,
    }),
    text: text([
      `¡Ya estás en la lista de Foliocrew! Tienes el puesto #${p.position}.`,
      "Quienes se anotan primero entran antes y con precio especial de lanzamiento. Te escribiremos cuando tengas tu invitación.",
      `Invita a alguien que cree contenido: ${p.shareUrl}`,
      `${unsubscribeLabel("es")}: ${p.unsubscribeUrl}`,
    ]),
  };
}

export function waitlistInviteEmail(p: { origin: string; name: string | null; registerUrl: string; inviteCode: string; unsubscribeUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return waitlistInviteEmailEn(p);
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
      unsubscribeUrl: p.unsubscribeUrl,
    }),
    text: text([
      hello(p.name),
      "Ya puedes crear tu cuenta de Foliocrew.",
      `Tu código de invitación: ${p.inviteCode}`,
      `Crea tu cuenta aquí: ${p.registerUrl}`,
      `${unsubscribeLabel("es")}: ${p.unsubscribeUrl}`,
    ]),
  };
}

// ─── Pagos (manuales: PayPal o transferencia) ───

export function paymentReportedAdminEmail(p: {
  origin: string;
  creatorName: string;
  email: string;
  plan: string;
  months: number;
  amount: string;
  method: string;
  reference: string | null;
  note: string | null;
  accountUrl: string;
  lang?: MailLang;
}) {
  if (p.lang === "en") return paymentReportedAdminEmailEn(p);
  const subject = `Pago reportado: ${p.creatorName} — ${p.amount} (${p.method})`;
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: `${p.creatorName} dice que pagó ${p.amount}.`,
      title: "Revisa este pago",
      body: [
        `<strong>${escapeHtml(p.creatorName)}</strong> (${escapeHtml(p.email)}) avisó que pagó <strong>${escapeHtml(p.amount)}</strong> por <strong>${escapeHtml(p.plan)}</strong> (${p.months} ${p.months === 1 ? "mes" : "meses"}) por ${escapeHtml(p.method)}.`,
        `Referencia o ID: ${escapeHtml(p.reference || "—")}${p.note ? `<br>Nota: ${escapeHtml(p.note)}` : ""}`,
        "Cuando veas el dinero en tu PayPal o en tu banco, confírmalo en el panel: su plan se activa y le llega un correo.",
      ],
      button: { label: "Revisar y confirmar", url: p.accountUrl },
    }),
    text: text([
      `${p.creatorName} (${p.email}) avisó que pagó ${p.amount} por ${p.plan} (${p.months} meses) por ${p.method}.`,
      `Referencia: ${p.reference || "—"}${p.note ? `\nNota: ${p.note}` : ""}`,
      `Confírmalo aquí: ${p.accountUrl}`,
    ]),
  };
}

export function paymentConfirmedEmail(p: { origin: string; name: string | null; plan: string; amount: string; paidUntil: string; planUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return paymentConfirmedEmailEn(p);
  const subject = "Recibimos tu pago 💜";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: `Tu plan ${p.plan} está activo hasta el ${p.paidUntil}.`,
      title: "¡Gracias! Tu pago está confirmado",
      body: [
        escapeHtml(hello(p.name)),
        `Recibimos tu pago de <strong>${escapeHtml(p.amount)}</strong>. Tu plan <strong>${escapeHtml(p.plan)}</strong> está activo hasta el <strong>${escapeHtml(p.paidUntil)}</strong>.`,
        "No se renueva solo: unos días antes de que venza te mandamos un recordatorio.",
      ],
      button: { label: "Ver mi plan", url: p.planUrl },
    }),
    text: text([
      hello(p.name),
      `Recibimos tu pago de ${p.amount}. Tu plan ${p.plan} está activo hasta el ${p.paidUntil}.`,
      `Ver tu plan: ${p.planUrl}`,
    ]),
  };
}

export function paymentRejectedEmail(p: { origin: string; name: string | null; amount: string; planUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return paymentRejectedEmailEn(p);
  const subject = "No encontramos tu pago";
  return {
    subject,
    html: layout({
      origin: p.origin,
      preheader: "Revisemos juntos el pago que reportaste.",
      title: "No encontramos tu pago",
      body: [
        escapeHtml(hello(p.name)),
        `Revisamos y todavía no vemos el pago de <strong>${escapeHtml(p.amount)}</strong> que reportaste. Puede que falte la referencia o que la transferencia tarde un poco más.`,
        "Responde este correo con el comprobante (captura o PDF) y lo revisamos enseguida.",
      ],
      button: { label: "Ver mi plan", url: p.planUrl },
    }),
    text: text([hello(p.name), `No encontramos el pago de ${p.amount} que reportaste. Responde este correo con el comprobante.`, p.planUrl]),
  };
}

export type ReminderKind = "trial-ending" | "renewal-due" | "expired";

export function billingReminderEmail(p: { origin: string; name: string | null; kind: ReminderKind; date: string; days: number; planUrl: string; lang?: MailLang }) {
  if (p.lang === "en") return billingReminderEmailEn(p);
  const copy = {
    "trial-ending": {
      subject: `Tu prueba de Foliocrew termina en ${p.days} ${p.days === 1 ? "día" : "días"}`,
      title: "Tu prueba gratis está por terminar",
      line: `Tu prueba gratis termina el <strong>${escapeHtml(p.date)}</strong>. Para seguir con tu portafolio, tu media kit y tu panel, elige tu plan y paga por PayPal o transferencia.`,
    },
    "renewal-due": {
      subject: `Tu plan de Foliocrew vence en ${p.days} ${p.days === 1 ? "día" : "días"}`,
      title: "Tu plan está por vencer",
      line: `Tu plan vence el <strong>${escapeHtml(p.date)}</strong>. No se renueva solo: renuévalo por PayPal o transferencia para que todo siga igual.`,
    },
    expired: {
      subject: "Tu plan de Foliocrew venció",
      title: "Tu plan venció",
      line: `Tu plan venció el <strong>${escapeHtml(p.date)}</strong>. Tus datos están a salvo; renueva para seguir usando Foliocrew sin cortes.`,
    },
  }[p.kind];
  return {
    subject: copy.subject,
    html: layout({
      origin: p.origin,
      preheader: copy.subject,
      title: copy.title,
      body: [escapeHtml(hello(p.name)), copy.line],
      button: { label: "Ver cómo pagar", url: p.planUrl },
      note: "¿Dudas o quieres otro método de pago? Responde este correo.",
    }),
    text: text([hello(p.name), copy.line.replace(/<[^>]+>/g, ""), `Cómo pagar: ${p.planUrl}`]),
  };
}

// ─── Equipo de Foliocrew: soporte, ideas y datos ───

/** Aviso genérico (tickets, pedidos de datos…). `lines` es texto plano: se escapa aquí. */
export function noticeEmail(p: {
  origin: string;
  name?: string | null;
  subject: string;
  title: string;
  lines: string[];
  /** Texto citado (mensaje del ticket, detalle del pedido). */
  quote?: string;
  button: { label: string; url: string };
  note?: string;
  lang?: MailLang;
}) {
  const body = [
    ...(p.name !== undefined ? [escapeHtml(hello(p.name, p.lang))] : []),
    ...p.lines.map(escapeHtml),
    ...(p.quote
      ? [`<span style="display:block;border-left:3px solid ${PLUM};padding:4px 0 4px 14px;color:${INK};">${escapeHtml(p.quote).replace(/\n/g, "<br>")}</span>`]
      : []),
  ];
  return {
    subject: p.subject,
    html: layout({
      lang: p.lang,
      origin: p.origin,
      preheader: p.lines[0] ?? p.title,
      title: p.title,
      body,
      button: p.button,
      note: p.note ? escapeHtml(p.note) : undefined,
    }),
    text: text([p.name !== undefined ? hello(p.name, p.lang) : undefined, ...p.lines, p.quote, `${p.button.label}: ${p.button.url}`, p.note]),
  };
}

// ─── Versiones en inglés (para quien usa el panel en inglés) ───

const textEn = (lines: (string | false | undefined)[]) => text(lines);
const hi = (name: string | null | undefined) => hello(name, "en");

function welcomeEmailEn(p: { origin: string; name: string | null; siteUrl: string; panelUrl: string; verifyUrl: string }) {
  return {
    subject: "Your Foliocrew space is ready",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: "Confirm your email and finish your site in 10 minutes.",
      title: "Welcome to Foliocrew",
      body: [
        escapeHtml(hi(p.name)),
        "Your account is set up. First, confirm your email: that way we can let you know when a brand writes to you and help if you forget your password.",
      ],
      button: { label: "Confirm my email", url: p.verifyUrl },
      note: `Your site: <a href="${escapeHtml(p.siteUrl)}" style="color:${PLUM};">${escapeHtml(p.siteUrl)}</a><br>Your dashboard: <a href="${escapeHtml(p.panelUrl)}" style="color:${PLUM};">${escapeHtml(p.panelUrl)}</a><br><br>The confirmation link expires in 3 days. If you didn't create this account, ignore this email.`,
    }),
    text: textEn([
      hi(p.name),
      "Your Foliocrew account is set up. Confirm your email with this link (expires in 3 days):",
      p.verifyUrl,
      `Your site: ${p.siteUrl}`,
      `Your dashboard: ${p.panelUrl}`,
      "If you didn't create this account, ignore this email.",
    ]),
  };
}

function verifyEmailEn(p: { origin: string; name: string | null; verifyUrl: string }) {
  return {
    subject: "Confirm your Foliocrew email",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: "One click and you're done.",
      title: "Confirm your email",
      body: [escapeHtml(hi(p.name)), "Tap the button to confirm this email is yours."],
      button: { label: "Confirm my email", url: p.verifyUrl },
      note: "The link expires in 3 days. If you didn't request it, ignore this email.",
    }),
    text: textEn([hi(p.name), "Confirm your Foliocrew email with this link (expires in 3 days):", p.verifyUrl]),
  };
}

function passwordResetEmailEn(p: { origin: string; name: string | null; resetUrl: string }) {
  return {
    subject: "Reset your Foliocrew password",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: "The link expires in 1 hour.",
      title: "Create a new password",
      body: [escapeHtml(hi(p.name)), "Someone (probably you) asked to reset the password for your Foliocrew account. Tap the button to choose a new one."],
      button: { label: "Choose a new password", url: p.resetUrl },
      note: "The link expires in 1 hour and only works once. If you didn't request it, ignore this email: your password stays the same.",
    }),
    text: textEn([
      hi(p.name),
      "To choose a new Foliocrew password, open this link (expires in 1 hour and only works once):",
      p.resetUrl,
      "If you didn't request it, ignore this email: your password stays the same.",
    ]),
  };
}

function passwordChangedEmailEn(p: { origin: string; name: string | null; forgotUrl: string }) {
  return {
    subject: "Your Foliocrew password changed",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: "Security notice.",
      title: "Your password changed",
      body: [
        escapeHtml(hi(p.name)),
        "The password for your Foliocrew account was just changed. For security, we signed you out of your other devices.",
        `If this wasn't you, <a href="${escapeHtml(p.forgotUrl)}" style="color:${PLUM};">reset your password now</a> and reply to this email.`,
      ],
    }),
    text: textEn([
      hi(p.name),
      "The password for your Foliocrew account was just changed. We signed you out of your other devices.",
      `If this wasn't you, reset it now: ${p.forgotUrl}`,
    ]),
  };
}

function emailChangedEmailEn(p: { origin: string; name: string | null; newEmail: string }) {
  return {
    subject: "Your Foliocrew account email changed",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: "Security notice.",
      title: "Your sign-in email changed",
      body: [
        escapeHtml(hi(p.name)),
        `Your Foliocrew account now signs in with <strong>${escapeHtml(p.newEmail)}</strong>. From now on, notifications go to that email.`,
        "If this wasn't you and you didn't request it, reply to this email as soon as possible and we'll look into it.",
      ],
    }),
    text: textEn([
      hi(p.name),
      `Your Foliocrew account now signs in with ${p.newEmail}. From now on, notifications go to that email.`,
      "If this wasn't you and you didn't request it, reply to this email as soon as possible.",
    ]),
  };
}

function brandMessageEmailEn(p: {
  origin: string;
  creatorName: string | null;
  fromName: string;
  brand: string;
  fromEmail: string;
  collaborationType: string;
  message: string;
  inboxUrl: string;
}) {
  const quote = escapeHtml(p.message).replace(/\n/g, "<br>");
  return {
    subject: `New collaboration: ${p.brand} (${p.collaborationType})`,
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: `${p.fromName} from ${p.brand} wrote to you through your site.`,
      title: "A brand wrote to you",
      body: [
        escapeHtml(hi(p.creatorName)),
        `<strong>${escapeHtml(p.fromName)}</strong> from <strong>${escapeHtml(p.brand)}</strong> wrote to you through your site.<br>Collaboration type: ${escapeHtml(p.collaborationType)}<br>Email: <a href="mailto:${escapeHtml(p.fromEmail)}" style="color:${PLUM};">${escapeHtml(p.fromEmail)}</a>`,
        `<span style="display:block;border-left:3px solid ${PLUM};padding:4px 0 4px 14px;color:${INK};">${quote}</span>`,
      ],
      button: { label: "Reply from my Inbox", url: p.inboxUrl },
      note: "You can also reply to this email: it goes straight to the brand.",
    }),
    text: textEn([
      hi(p.creatorName),
      `${p.fromName} from ${p.brand} wrote to you through your site (${p.collaborationType}).`,
      `Email: ${p.fromEmail}`,
      p.message,
      `Your Inbox: ${p.inboxUrl}`,
    ]),
  };
}

function waitlistJoinedEmailEn(p: { origin: string; position: number; shareUrl: string; unsubscribeUrl: string }) {
  return {
    subject: "You're on the Foliocrew list 💜",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: `You're #${p.position}.`,
      title: "You're on the list!",
      body: [
        `You're <strong>#${p.position}</strong>. We're opening Foliocrew by invitation: the first to sign up get in sooner and at a special launch price.`,
        "Foliocrew brings your bilingual portfolio, media kit, brands and calendar together in one place, so you look professional from day one.",
        `Know someone who creates content? Send them this link: <a href="${escapeHtml(p.shareUrl)}" style="color:${PLUM};">${escapeHtml(p.shareUrl)}</a>`,
      ],
      note: "We'll email you here when your invitation is ready.",
      unsubscribeUrl: p.unsubscribeUrl,
    }),
    text: textEn([
      `You're on the Foliocrew list! You're #${p.position}.`,
      "The first to sign up get in sooner and at a special launch price. We'll email you when your invitation is ready.",
      `Invite someone who creates content: ${p.shareUrl}`,
      `${unsubscribeLabel("en")}: ${p.unsubscribeUrl}`,
    ]),
  };
}

function waitlistInviteEmailEn(p: { origin: string; name: string | null; registerUrl: string; inviteCode: string; unsubscribeUrl: string }) {
  return {
    subject: "Your Foliocrew invitation is here ✨",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: "Create your account and build your portfolio in 10 minutes.",
      title: "Your invitation arrived",
      body: [
        escapeHtml(hi(p.name)),
        "You can now create your Foliocrew account. The setup assistant builds your bilingual portfolio in about 10 minutes: photo, bio, your best videos and your contact info.",
        `Your invite code: <strong style="font-family:monospace;font-size:18px;letter-spacing:1px;">${escapeHtml(p.inviteCode)}</strong>`,
      ],
      button: { label: "Create my account", url: p.registerUrl },
      note: "Please don't share the code publicly.",
      unsubscribeUrl: p.unsubscribeUrl,
    }),
    text: textEn([hi(p.name), "You can now create your Foliocrew account.", `Your invite code: ${p.inviteCode}`, `Create your account here: ${p.registerUrl}`, `${unsubscribeLabel("en")}: ${p.unsubscribeUrl}`]),
  };
}

function paymentReportedAdminEmailEn(p: {
  origin: string;
  creatorName: string;
  email: string;
  plan: string;
  months: number;
  amount: string;
  method: string;
  reference: string | null;
  note: string | null;
  accountUrl: string;
}) {
  const months = `${p.months} ${p.months === 1 ? "month" : "months"}`;
  return {
    subject: `Payment reported: ${p.creatorName} — ${p.amount} (${p.method})`,
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: `${p.creatorName} says they paid ${p.amount}.`,
      title: "Review this payment",
      body: [
        `<strong>${escapeHtml(p.creatorName)}</strong> (${escapeHtml(p.email)}) reported paying <strong>${escapeHtml(p.amount)}</strong> for <strong>${escapeHtml(p.plan)}</strong> (${months}) via ${escapeHtml(p.method)}.`,
        `Reference or ID: ${escapeHtml(p.reference || "—")}${p.note ? `<br>Note: ${escapeHtml(p.note)}` : ""}`,
        "Once you see the money in your PayPal or bank, confirm it in the dashboard: their plan activates and they get an email.",
      ],
      button: { label: "Review and confirm", url: p.accountUrl },
    }),
    text: textEn([
      `${p.creatorName} (${p.email}) reported paying ${p.amount} for ${p.plan} (${months}) via ${p.method}.`,
      `Reference: ${p.reference || "—"}${p.note ? `\nNote: ${p.note}` : ""}`,
      `Confirm it here: ${p.accountUrl}`,
    ]),
  };
}

function paymentConfirmedEmailEn(p: { origin: string; name: string | null; plan: string; amount: string; paidUntil: string; planUrl: string }) {
  return {
    subject: "We received your payment 💜",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: `Your ${p.plan} plan is active until ${p.paidUntil}.`,
      title: "Thank you! Your payment is confirmed",
      body: [
        escapeHtml(hi(p.name)),
        `We received your payment of <strong>${escapeHtml(p.amount)}</strong>. Your <strong>${escapeHtml(p.plan)}</strong> plan is active until <strong>${escapeHtml(p.paidUntil)}</strong>.`,
        "It doesn't renew automatically: a few days before it expires we'll send you a reminder.",
      ],
      button: { label: "See my plan", url: p.planUrl },
    }),
    text: textEn([hi(p.name), `We received your payment of ${p.amount}. Your ${p.plan} plan is active until ${p.paidUntil}.`, `See your plan: ${p.planUrl}`]),
  };
}

function paymentRejectedEmailEn(p: { origin: string; name: string | null; amount: string; planUrl: string }) {
  return {
    subject: "We couldn't find your payment",
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: "Let's check the payment you reported together.",
      title: "We couldn't find your payment",
      body: [
        escapeHtml(hi(p.name)),
        `We checked and still don't see the <strong>${escapeHtml(p.amount)}</strong> payment you reported. The reference may be missing or the transfer may take a little longer.`,
        "Reply to this email with the receipt (screenshot or PDF) and we'll check it right away.",
      ],
      button: { label: "See my plan", url: p.planUrl },
    }),
    text: textEn([hi(p.name), `We couldn't find the ${p.amount} payment you reported. Reply to this email with the receipt.`, p.planUrl]),
  };
}

function billingReminderEmailEn(p: { origin: string; name: string | null; kind: ReminderKind; date: string; days: number; planUrl: string }) {
  const days = `${p.days} ${p.days === 1 ? "day" : "days"}`;
  const copy = {
    "trial-ending": {
      subject: `Your Foliocrew trial ends in ${days}`,
      title: "Your free trial is ending soon",
      line: `Your free trial ends on <strong>${escapeHtml(p.date)}</strong>. To keep your portfolio, media kit and dashboard, choose your plan and pay via PayPal or bank transfer.`,
    },
    "renewal-due": {
      subject: `Your Foliocrew plan expires in ${days}`,
      title: "Your plan is about to expire",
      line: `Your plan expires on <strong>${escapeHtml(p.date)}</strong>. It doesn't renew automatically: renew via PayPal or bank transfer so everything stays the same.`,
    },
    expired: {
      subject: "Your Foliocrew plan expired",
      title: "Your plan expired",
      line: `Your plan expired on <strong>${escapeHtml(p.date)}</strong>. Your data is safe; renew to keep using Foliocrew without interruptions.`,
    },
  }[p.kind];
  return {
    subject: copy.subject,
    html: layout({
      lang: "en",
      origin: p.origin,
      preheader: copy.subject,
      title: copy.title,
      body: [escapeHtml(hi(p.name)), copy.line],
      button: { label: "See how to pay", url: p.planUrl },
      note: "Questions or want another payment method? Reply to this email.",
    }),
    text: textEn([hi(p.name), copy.line.replace(/<[^>]+>/g, ""), `How to pay: ${p.planUrl}`]),
  };
}


/** Aviso a la embajadora: ganó meses gratis porque alguien que invitó ya cumplió sus 30 días pagando. */
export function ambassadorRewardEmail(p: { origin: string; name: string | null; months: number; panelUrl: string; lang?: MailLang }) {
  if (p.lang === "en") {
    const months = `${p.months} free ${p.months === 1 ? "month" : "months"}`;
    return {
      subject: `You earned ${months} 💜`,
      html: layout({
        lang: "en",
        origin: p.origin,
        preheader: `Someone you invited stayed: ${months} added to your plan.`,
        title: `You earned ${months}!`,
        body: [
          escapeHtml(hi(p.name)),
          `Someone who signed up with your ambassador link has been paying for 30 days. We added <strong>${escapeHtml(months)}</strong> to your plan. Thank you for spreading the word about Foliocrew.`,
          "You can see your numbers and your sharing kit in your ambassador panel.",
        ],
        button: { label: "Open my ambassador panel", url: p.panelUrl },
      }),
      text: textEn([hi(p.name), `Someone who signed up with your ambassador link has been paying for 30 days. We added ${months} to your plan.`, `Your panel: ${p.panelUrl}`]),
    };
  }
  const months = `${p.months} ${p.months === 1 ? "mes gratis" : "meses gratis"}`;
  return {
    subject: `Ganaste ${months} 💜`,
    html: layout({
      origin: p.origin,
      preheader: `Alguien que invitaste se quedó: ${months} sumados a tu plan.`,
      title: `¡Ganaste ${months}!`,
      body: [
        escapeHtml(hello(p.name)),
        `Alguien que se registró con tu enlace de embajadora lleva 30 días pagando. Sumamos <strong>${escapeHtml(months)}</strong> a tu plan. Gracias por hablar bien de Foliocrew.`,
        "Puedes ver tus números y tu kit para compartir en tu panel de embajadora.",
      ],
      button: { label: "Abrir mi panel de embajadora", url: p.panelUrl },
    }),
    text: text([hello(p.name), `Alguien que se registró con tu enlace de embajadora lleva 30 días pagando. Sumamos ${months} a tu plan.`, `Tu panel: ${p.panelUrl}`]),
  };
}
