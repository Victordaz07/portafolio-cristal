# Seguridad de Foliocrew

Qué protege hoy el sistema, qué tienes que configurar tú y qué hacer si algo sale mal.
Regla de siempre: **nunca pegues llaves ni secretos en un chat, un ticket o una captura.**

## Lo que ya hace el sistema

| Protección | Cómo funciona | Dónde está |
| --- | --- | --- |
| Contraseñas | Se guarda solo su hash (bcrypt, costo 12); mínimo 8 caracteres. | `lib/creators.ts` |
| Verificación en dos pasos | Opcional. Código de 6 dígitos de una app (TOTP) + 8 códigos de recuperación de un solo uso. La clave se guarda cifrada. | `lib/totp.ts`, `lib/two-factor.ts`, Mi cuenta |
| Bloqueo por intentos | 10 intentos fallidos seguidos (de contraseña o de código) bloquean la cuenta 15 minutos. Se guarda en la base, así que no se reinicia entre servidores. Restablecer la contraseña por correo quita el bloqueo. | `lib/login-guard.ts`, `/api/admin/login` |
| Límite por IP | Login, registro, recuperar contraseña, lista de espera y formularios públicos. En memoria de cada servidor: frena abusos básicos. | `lib/rate-limit.ts` |
| Sesiones | Cookie `httpOnly`, `secure`, `sameSite=lax`, 7 días. Cambiar la contraseña o la verificación en dos pasos cierra las sesiones de los otros equipos. | `lib/auth.ts`, `lib/tenant.ts` |
| Control de origen | Las APIs del panel rechazan cambios pedidos desde otra dirección (incluido otro subdominio). | `middleware.ts` |
| Enlaces por correo | Recuperar contraseña (1 hora) y confirmar correo (3 días): un solo uso, y en la base solo va su hash. | `lib/auth-tokens.ts` |
| Tokens de redes | Cifrados con AES-256-GCM (`TOKEN_ENCRYPTION_KEY`). | `lib/token-crypto.ts` |
| Separación entre cuentas | Cada consulta va filtrada por la creadora de la sesión. | `lib/prisma.ts`, `lib/tenant.ts` |
| Acceso del equipo | "Entrar como" pide motivo, queda registrado y la cuenta lo ve en Mi cuenta. | `PlatformAction` |
| Cabeceras | Sin iframes ajenos, sin `<base>` ni plugins ajenos, formularios solo a este sitio, `nosniff`, cámara/micrófono/ubicación apagados. | `next.config.mjs` |
| Avisos por correo | Cambio de contraseña, de correo, de verificación en dos pasos y uso de un código de recuperación. | `lib/account-emails.ts`, `lib/two-factor.ts` |

### Verificación en dos pasos: lo que conviene saber

- Se activa en **Mi cuenta → Verificación en dos pasos**. Necesita `TOKEN_ENCRYPTION_KEY` en Vercel (la misma de Conectar cuentas).
- **Actívala tú primero**, y pídesela a todo el equipo (Soporte, Moderación): esas cuentas pueden ver datos de las demás.
- Con ella activa, restablecer la contraseña por correo **no** deja entrar directo: después hay que dar el código.
- Si alguien pierde el teléfono **y** los códigos de recuperación: en **Foliocrew → Cuentas → (la cuenta) → Quitar verificación en dos pasos**. Antes confirma que es la persona (que te escriba desde su correo de siempre). Queda registrado y le llega un aviso.
- Si te pasa a ti (la cuenta dueña): no hay botón. Se quita en la base de datos (Neon → SQL Editor):
  `UPDATE "AdminUser" SET "totpSecret" = NULL, "totpEnabledAt" = NULL, "totpLastStep" = NULL, "totpRecoveryCodes" = '{}' WHERE email = 'tu@correo.com';`
  Por eso: guarda tus códigos de recuperación en tu gestor de contraseñas.
- **No cambies `TOKEN_ENCRYPTION_KEY`** con cuentas que ya la activaron: sus claves dejan de poder leerse y no podrían entrar (ver "Rotar llaves").

## Lo que te toca a ti (fuera del código)

1. Verificación en dos pasos en **todas** las cuentas que sostienen Foliocrew: GitHub, Vercel, Neon, Resend, el registrador del dominio, Meta/TikTok/Google developers, PayPal y el correo de `PLATFORM_ADMIN_EMAILS`. Quien entra a tu Vercel o a tu correo se salta todo lo de arriba.
2. En Neon: confirma que las copias de seguridad (restauración a un punto en el tiempo) están activas y cuántos días cubren.
3. En GitHub: protege la rama `main` (cambios solo por PR con la CI en verde).
4. Revisa cada cierto tiempo **Foliocrew → Cuentas** (acciones de administración) y los registros de Vercel.

## Pendiente (requiere probar en un navegador antes de activarlo)

- **Política de contenido estricta para scripts** (`script-src` con nonce). Hoy la CSP no limita de dónde cargan los scripts. Activarla sin probar puede romper los embeds de Instagram/TikTok/Facebook, el píxel y la subida de archivos.

## Si pasa algo: plan de respuesta

Un incidente es cualquier acceso no autorizado a cuentas o datos: una llave filtrada, una cuenta del equipo
comprometida, datos de una creadora visibles para otra, o la base de datos expuesta.

### 1. Primera hora: contener
- **Cuenta comprometida:** pausa la cuenta (Cuentas → Pausar) y pide a la persona restablecer su contraseña.
- **Cuenta tuya o del equipo comprometida:** cambia la contraseña desde Mi cuenta (cierra las demás sesiones) y quita su rol en Equipo → Personas.
- **Llave filtrada** (en un chat, captura, repo): rótala ya (tabla de abajo). No esperes a confirmar si la usaron.
- **Fallo del código que expone datos:** revierte el despliegue en Vercel (Deployments → el anterior → Promote) mientras se arregla.
- Anota la hora y lo que vas haciendo. Lo vas a necesitar.

### 2. Primer día: entender el alcance
- Qué datos, de qué cuentas, desde cuándo y hasta cuándo.
- Dónde mirar: registros de Vercel (Logs), `PlatformAction` (acciones de administración), `lastLoginAt` de las cuentas, el historial de Neon y los registros de Resend.
- No borres registros ni "limpies" antes de entender qué pasó.

### 3. Avisar
- **A las personas afectadas**, sin demora: qué pasó, qué datos, qué hiciste y qué deben hacer (cambiar contraseña, reconectar redes). Claro y sin minimizar.
- **California** (Civ. Code §1798.82) obliga a avisar a sus residentes cuando se exponen ciertos datos personales sin cifrar (por ejemplo, correo + contraseña); hay plazo legal y, si son más de 500 personas, aviso al fiscal general del estado.
- **Unión Europea** (RGPD): si hay usuarias allá, aviso a la autoridad en 72 horas.
- **Meta, TikTok y Google**: sus términos de plataforma piden avisarles si se exponen datos obtenidos por sus APIs.
- Los plazos y a quién avisar dependen del caso: **habla con un abogado el mismo día**. Esto no es asesoría legal.

### 4. Después
- Arregla la causa, agrega una prueba que la cubra y escribe qué pasó y qué cambió (aunque sea media página).

### Rotar llaves

| Variable | Dónde se genera | Qué pasa al cambiarla |
| --- | --- | --- |
| `AUTH_SECRET` | Texto largo al azar | Todas las sesiones se cierran (todos vuelven a entrar). Los enlaces de baja de correos ya enviados dejan de servir. |
| `TOKEN_ENCRYPTION_KEY` | Texto largo al azar | **Rompe** los tokens de redes (todas reconectan) y la verificación en dos pasos. Antes de cambiarla, quítasela a todas: `UPDATE "AdminUser" SET "totpSecret" = NULL, "totpEnabledAt" = NULL, "totpLastStep" = NULL, "totpRecoveryCodes" = '{}';` y avisa para que la activen de nuevo. |
| `DATABASE_URL` / `DIRECT_URL` | Neon → Roles → Reset password | Hay que actualizar ambas en Vercel y redesplegar. |
| `RESEND_API_KEY` | Resend → API Keys | Borra la anterior en Resend. |
| `PUBLIC_BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob | Los archivos ya subidos siguen visibles. |
| `CRON_SECRET` | Texto largo al azar | Actualiza también el programador externo si usas uno. |
| Secretos de Meta, TikTok y Google | Consola de cada red | Reinícialos allá y actualízalos en Vercel. |
| `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` | Todos vuelven a activar los avisos en el celular. |
| `SIGNUP_INVITE_CODE` | El que quieras | Las invitaciones ya enviadas dejan de servir. |

Después de cambiar cualquier variable en Vercel: **Redeploy**.
