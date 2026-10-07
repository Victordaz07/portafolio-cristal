# Correos de Foliocrew (Fase 12)

Foliocrew manda sus correos con **Resend** (https://resend.com). El código está en `lib/email.ts` (envío)
y `lib/email-templates.ts` (plantillas con la marca, en HTML y texto plano).

## Qué correos se mandan

| Correo | Cuándo | A quién |
| --- | --- | --- |
| **Bienvenida + confirmar correo** | Al crear una cuenta | La persona nueva |
| **Confirmar correo** (reenvío) | Botón "Reenviar enlace" del panel | La persona con sesión |
| **Restablecer contraseña** | En `/admin/recuperar` | Quien lo pide (si tiene cuenta) |
| **Tu contraseña cambió** | Al restablecerla o cambiarla en Mi cuenta | La dueña o dueño de la cuenta |
| **Una marca te escribió** | Formulario de contacto del sitio | El correo de contacto del sitio (o el de la cuenta) |
| **Ya estás en la lista** | Al anotarse en la lista de espera | La persona anotada |
| **Tu invitación a Foliocrew** | Botón "Invitar por correo" en Lista de espera | Las personas seleccionadas (con link y código) |

## Baja y dirección postal (CAN-SPAM)

- Los dos correos de la **lista de espera** traen un enlace **"Darme de baja"** (y la cabecera `List-Unsubscribe`,
  para que Gmail y Outlook muestren su propio botón). El enlace va firmado y llega a `/api/waitlist/unsubscribe`.
  Quien se da de baja queda marcado como **Baja** en la Lista de espera y ya no recibe la invitación aunque lo
  selecciones; si vuelve a anotarse en la página, vuelve a recibir correos.
- Los demás correos son de la cuenta (confirmar correo, contraseña, pagos, avisos): no llevan baja porque no son publicidad.
- `LEGAL_POSTAL_ADDRESS` (Vercel → Environment Variables): la dirección postal que sale al pie de **todos** los
  correos y en la sección de derechos de autor de `/terminos`. Sirve un apartado postal (PO Box). Sin ella el pie
  sale sin dirección.
- Si algún día mandas un boletín o promociones a quienes ya tienen cuenta, ese correo también necesita su baja:
  hay que agregarla antes de enviarlo.

Sin `RESEND_API_KEY` la app funciona igual: los mensajes se guardan y nada falla, pero no sale ningún correo.

## Seguridad

- Los enlaces de recuperar contraseña duran **1 hora** y los de confirmar correo **3 días**. Son de un solo uso
  y en la base de datos solo se guarda su hash (`AuthToken`).
- `/admin/recuperar` responde lo mismo exista o no la cuenta (no revela qué correos están registrados) y tiene
  límite de intentos por IP y por correo.
- Al restablecer o cambiar la contraseña, sube `AdminUser.sessionVersion` y se **cierran las sesiones abiertas
  en otros equipos** (en hasta 30 segundos).

## Activarlo (una vez)

1. Crea una cuenta en https://resend.com (el plan gratis manda 3,000 correos al mes y 100 al día).
2. En **Domains → Add Domain**, agrega `foliocrew.pro`. Resend te muestra unos registros DNS (MX, TXT/SPF y
   DKIM; a veces también DMARC).
3. Como los nameservers de `foliocrew.pro` son los de Vercel, esos registros se agregan en **Vercel →
   (tu equipo) → Domains → foliocrew.pro → DNS Records**, uno por uno, copiando nombre, tipo y valor.
4. Vuelve a Resend y toca **Verify**. Puede tardar de minutos a unas horas.
5. En **API Keys → Create API Key** (permiso "Sending access", dominio `foliocrew.pro`). Copia la clave:
   solo se muestra una vez. **No la pegues en ningún chat.**
6. En Vercel → proyecto → **Settings → Environment Variables** (Production):
   - `RESEND_API_KEY` = la clave
   - `EMAIL_FROM` = `Foliocrew <hola@foliocrew.pro>`
   - `EMAIL_REPLY_TO` = el correo donde quieres recibir respuestas (por ejemplo tu Gmail)
7. **Redeploy**.

Para probar: en `foliocrew.pro/admin/recuperar` pide el enlace con tu correo.

## Desarrollo local

Sin `RESEND_API_KEY`, pon `EMAIL_OUTBOX_FILE="/tmp/outbox.jsonl"` en `.env`: cada correo se guarda ahí
(una línea JSON) en vez de enviarse. Solo funciona fuera de producción.
