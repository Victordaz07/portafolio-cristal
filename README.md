# Portafolio Crislia UGC

Portafolio interactivo para Cristal Amalia Flores Bello (Crislia), creadora de
contenido UGC (beauty, skincare, hair, books, lifestyle), dirigido a marcas
que quieren contratar colaboraciones. Incluye sitio público **bilingüe
(español / inglés)** — media kit, feed de contenido, reseñas, servicios,
paquetes, testimonios, FAQ y contacto — y un panel `/admin` protegido para
editar absolutamente todo el contenido sin tocar código.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (tokens de diseño en `tailwind.config.ts`)
- Prisma + Postgres (Neon)
- Auth de admin: cookie de sesión firmada (`jose`) + `bcryptjs`
- Subida de imágenes/video: Vercel Blob (requiere un store con acceso **público**, ver nota abajo)
- Envío de correo del formulario de contacto: Resend (opcional)
- Embeds reales de TikTok / Instagram / Facebook, con opción de subir video propio
- Feed con dos tipos de tarjeta: post de red social, o foto de portafolio propia sin red social (con marca opcional)
- Miniatura de tarjetas: automática por oEmbed en TikTok; para Instagram/Facebook se
  intenta traer el `og:image` del post (`/api/admin/resolve-thumbnail`) con opción de
  subir una manualmente si falla
- i18n propio (sin librería externa): cookie `locale` + diccionario en `lib/i18n.ts`

## Requisitos previos

- Node.js 18+
- Una base de datos Postgres (Neon, Vercel Postgres, o cualquier Postgres).
  Para desarrollo local sin cuenta, se puede generar una gratis con
  `npx create-db` (Prisma Postgres, se borra a las 24h si no se reclama).

## Variables de entorno

Copia `.env.example` a `.env` y completa:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Connection string de Postgres. |
| `ADMIN_EMAIL` | Correo con el que Crislia inicia sesión en `/admin`. |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt de la contraseña de admin (ver abajo). |
| `AUTH_SECRET` | Secreto aleatorio para firmar la cookie de sesión. |
| `RESEND_API_KEY` | Opcional. Si falta, el formulario de contacto sigue guardando el mensaje en la base de datos pero no envía el correo (queda como TODO en `app/api/contact/route.ts`). |
| `NEXT_PUBLIC_FB_APP_ID` | Necesario para mostrar embeds de Facebook. |
| `PUBLIC_BLOB_READ_WRITE_TOKEN` | Necesario para subir fotos, videos y logos de marcas. Debe ser el token de un Blob Store con acceso **público** (la app siempre sube con `access: "public"`). |
| `TOKEN_ENCRYPTION_KEY` | Cifra los tokens de redes sociales en la base de datos. Obligatoria para conectar redes. No cambiarla después de conectar cuentas. |
| `APP_URL` | URL pública fija del sitio, usada para armar las URLs de redirección OAuth. |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | App de Meta con Instagram API (Instagram Login). |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CONFIG_ID` | Facebook Login for Business (páginas). `FACEBOOK_CONFIG_ID` es opcional. |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | TikTok Login Kit. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth de Google con YouTube Data API v3. |
| `ANTHROPIC_API_KEY` | Claude, para las sugerencias de IA. |
| `PLATFORM_NAME`, `LEGAL_OWNER_NAME`, `LEGAL_CONTACT_EMAIL` | Opcionales. Nombre de la plataforma y datos del responsable que aparecen en las páginas legales (`lib/site-config.ts`). |

**Importante:** Next.js expande `$VAR` dentro de los archivos `.env`. El hash
de bcrypt empieza con `$2b$...`, así que hay que escapar cada `$` como `\$`
al pegarlo en `.env` (ver ejemplo en `.env.example`).

Generar el hash de la contraseña:

```bash
node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD', 10))"
```

Generar el `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Desarrollo local

```bash
npm install
npx prisma migrate dev   # crea las tablas
npm run db:seed          # carga el contenido real de Crislia (opcional)
npm run dev
```

Sitio público: [http://localhost:3000](http://localhost:3000)
Panel admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Marca

La plataforma se llama **Foliocrew** (`PLATFORM_NAME`). El logo, los colores, las tipografías y la voz están en [`docs/marca.md`](docs/marca.md); el kit completo (redes, campañas y prompts) está en [`docs/foliocrew-kit-de-marca.md`](docs/foliocrew-kit-de-marca.md). Los archivos del logo viven en `public/brand/`. El sitio público de cada persona creadora mantiene su propia identidad.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npx tsc --noEmit` — chequeo de tipos
- `npx prisma migrate dev` — aplica el schema a la base de datos (local)
- `npx prisma migrate deploy` — aplica las migraciones pendientes (producción)
- `npm run db:seed` — puebla la base con el contenido de ejemplo (`prisma/seed.ts`)
- `npm run brand:images` — genera las imágenes de marca con la API de imágenes de OpenAI (DALL·E / gpt-image). Necesita `OPENAI_API_KEY`; ver [`docs/marca.md`](docs/marca.md)

## Sitio público

El sitio (`app/page.tsx`) es bilingüe: un botón **ES/EN** en el nav (escritorio
y mobile) guarda la preferencia en una cookie (`locale`) y recarga el
Server Component correspondiente — no hay rutas separadas `/es` / `/en`.
Cada campo de texto editable en la base de datos tiene una columna paralela
`xxxEn` (nullable, con respaldo automático al español si está vacía); los
strings de diseño fijos (nav, botones, labels) viven en `lib/i18n.ts`.

Secciones del sitio: Hero, Media kit, Feed (tarjetas con estilo de cada red, métricas y "Lo que dicen"), Colaboraciones (por marca, hasta 3 piezas destacadas), Marcas, Reseñas
destacadas, Cómo trabajo, Paquetes, Testimonios, FAQ y Contacto.

Páginas legales públicas (las piden Meta, TikTok y Google para aprobar las apps):
`/privacidad`, `/terminos` y `/eliminar-datos`, en español e inglés (`?lang=en`).
Textos en `lib/legal-content.ts`; enlazadas desde el pie del sitio.

Dos detalles ocultos, pensados como un pequeño gesto para Crislia:

- **Frases motivadoras**: tocar dos veces seguidas el destello bajo el título
  del Hero (mobile) o el corazón de "Tu apoyo significa todo" muestra una
  frase al azar (40 frases bilingües en `lib/motivational-phrases.ts`).
- **Crédito del diseñador**: un botón circular discreto (ícono de átomo) al
  final del footer abre una tarjeta con los datos de contacto de quien
  construyó el sitio (`components/CreatorCredit.tsx`, datos centralizados en
  `lib/creator-info.ts`).

## Multiusuario (Foliocrew)

Cada persona creadora tiene su espacio (`Creator`) y **todas** las tablas tienen `creatorId`:

- **`lib/prisma.ts`**: el `prisma` de siempre, pero filtra solo por persona creadora.
  - Cada consulta lee únicamente filas de la persona creadora de la petición, crea filas a su nombre y solo edita o borra lo suyo.
  - También impide enlazar una marca ajena (`brandId`).
  - Si no sabe de qué persona creadora es la petición, falla.
- **`prismaRoot`** (`lib/prisma-root.ts`): el cliente sin filtro. Solo se usa para el login, el registro y para buscar dominios.
- **`lib/tenant.ts`** decide la persona creadora de cada petición:
  - En el panel, sale de la sesión.
  - En el sitio público, sale del dominio: `<slug>.PLATFORM_ROOT_DOMAIN`, el dominio propio de la persona creadora o, si no es ninguno de los dos, la persona creadora por defecto (`DEFAULT_CREATOR_SLUG`).
  - Para scripts, se usa `runAsCreator(id, fn)`.
- **`middleware.ts`** verifica la sesión y pasa la persona creadora en cabeceras internas (`lib/tenant-headers.ts`). Siempre borra las que manda el navegador.
- **Registro**:
  - Se hace en `/admin/registro` y pide `SIGNUP_INVITE_CODE`. Sin esa variable, el registro está cerrado.
  - Crea la persona creadora, su usuario, una portada y la configuración inicial.
- **Mi cuenta** (`/admin/cuenta`): nombre, contraseña y dirección del sitio.
- **Página de venta** (`app/foliocrew`, en `/foliocrew` y en la raíz del dominio de la plataforma):
  - secciones: portada, problema, cómo funciona, herramientas, para quién, planes (`lib/plans.ts`; precios ocultos salvo `FOLIOCREW_SHOW_PRICES=true`), FAQ y cierre;
  - **lista de espera** (`WaitlistEntry`, `app/api/waitlist`): guarda los UTM, tiene campo trampa para bots, límite de 5 intentos por minuto y no duplica correos;
  - imagen Open Graph y píxel de Meta opcional (`NEXT_PUBLIC_META_PIXEL_ID`);
  - quien administra la plataforma (`PLATFORM_ADMIN_EMAILS`) ve **Lista de espera** en el panel: totales, origen, CSV y marcar invitaciones enviadas.
- **Pagos manuales** ([`docs/pagos.md`](docs/pagos.md)): prueba gratis (`TRIAL_DAYS`), **Mi plan** (`/admin/plan`) con PayPal.me y datos de transferencia, aviso "Ya pagué" (`Payment` con estado reportado/confirmado/rechazado), confirmación desde **Cuentas** (extiende `Creator.paidUntil`), cuentas de cortesía (`comp`) y recordatorios diarios por correo (`/api/cron/billing`, Vercel Cron, `CRON_SECRET`).
- **Base de datos de previews** (`scripts/migrate.mjs`): el build solo aplica migraciones en producción o en un preview con su propia base (`DB_ENV=preview` en las variables de *Preview* de Vercel, junto con `DATABASE_URL`/`DIRECT_URL` de una rama de Neon). Un preview sin `DB_ENV=preview` no migra, para no tocar la base de producción.
- **Tipo de creador** (`Creator.creatorKind`, `lib/creator-kind.ts`): Foliocrew es para creadores de contenido y UGC. Cada cuenta elige "creador/a de contenido", "UGC" o "las dos cosas" en el asistente (o después en Mi cuenta); eso cambia las plantillas de bio, servicios, paquetes y preguntas (`lib/onboarding.ts`) y el contexto de la IA.
- **Estudio de diseño y Link en bio** ([`docs/estudio-de-diseno.md`](docs/estudio-de-diseno.md)): 5 estilos, 6 tipografías, color propio con contraste garantizado, 4 portadas, bordes, fondo, orden de secciones, vista previa en vivo, "Diséñalo por mí" con Claude, imagen para compartir (`/api/og`) y página `/enlaces` para la bio.
- **Miniaturas de Instagram/Facebook** (`lib/social/thumbnail.ts`): el link de portada que devuelven Instagram/Facebook caduca y bloquea el "hotlinking", así que en vez de guardarlo tal cual se descarga una vez y se resube a nuestro propio Blob Store. Además de pasar por ahí cada vez que se resuelve a mano ("Cargar preview") o se guarda una tarjeta, la tarea diaria `/api/cron/insights` (Vercel Cron, mismo `CRON_SECRET`) revisa todas las cuentas y rellena o renueva sola la miniatura de cualquier tarjeta que la tenga vacía o vencida — sin que nadie tenga que entrar al panel.
- **Revisión de las apps de redes** (Fase 14, [`docs/revision-de-apps.md`](docs/revision-de-apps.md)): textos en inglés, guiones de video y direcciones para Meta, TikTok y Google. El panel siempre abre en `PLATFORM_ROOT_DOMAIN/admin` (una sola dirección de regreso para OAuth). Callbacks de Meta: `/api/social/meta/deauthorize` y `/api/social/meta/data-deletion` (firma `signed_request`; borra la conexión y da un código para ver el estado en `/eliminar-datos?codigo=…`).
- **Panel de dueño** (Fase 13, `/admin/plataforma`, solo `PLATFORM_ADMIN_EMAILS`): todas las cuentas con altas, último ingreso, asistente, correo confirmado, redes y uso de IA del mes (`AiUsage`); ficha por cuenta con nota interna e historial (`PlatformAction`); **pausar/reactivar** (el sitio deja de verse y no puede entrar, sin borrar nada) y **"Entrar como"** para dar soporte (el token lleva `actorId`, se muestra una franja y no se pueden cambiar nombre ni contraseña).
- **Correos** (Fase 12, Resend; ver [`docs/correos.md`](docs/correos.md)): bienvenida con enlace para confirmar el correo, recuperar contraseña (`/admin/recuperar` → `/admin/restablecer`), aviso de contraseña cambiada (cierra las sesiones de otros equipos con `AdminUser.sessionVersion`), aviso cuando una marca escribe desde el sitio, y en la lista de espera: confirmación al anotarse e **Invitar por correo** (link + código). Los enlaces son de un solo uso y solo se guarda su hash (`AuthToken`).
- **Asistente de bienvenida** (`/admin/bienvenida`, `app/api/admin/onboarding`):
  - los creadores nuevas (`Creator.onboardedAt` nulo) llegan ahí desde el Resumen;
  - arma la portada, la bio, los servicios, los paquetes y las FAQ con plantillas por nicho (`lib/onboarding.ts`; nunca duplica secciones que ya tienen contenido), crea las primeras piezas a partir de sus links y guarda el contacto y el color;
  - la lista "Completa tu sitio" (`components/admin/SetupChecklist.tsx`) se muestra en el Resumen hasta completar todo.
- **Dominios** (ver [`docs/dominios.md`](docs/dominios.md)):
  - cada sitio tiene un dominio propio (en **Mi dominio**, con la API de Vercel), un subdominio (`<slug>.PLATFORM_ROOT_DOMAIN`) o la dirección provisional `/s/<slug>`;
  - la raíz de la plataforma muestra la portada de Foliocrew (`app/foliocrew`);
  - cada sitio tiene su propio `sitemap.xml` y `robots.txt`.
- **La migración `multiusuario`** crea a Cristal (`creator_cristal`, slug `cristal`) y le asigna todos los datos que ya existían.
- **Login**: la cuenta de `ADMIN_EMAIL` pasa sola a la base la primera vez que entra.

## Panel `/admin`

Todas las rutas bajo `/admin/*` y `/api/admin/*` (excepto login) están
protegidas por `middleware.ts`. El shell (`components/admin/AdminShell.tsx`)
tiene un sidebar oscuro con grupos colapsables (Crecimiento, Contenido,
Landing, Prueba social, Negocio, Ayuda), "Resumen" fijo arriba y badge de mensajes sin leer.
El Resumen (`/admin`) muestra seguimientos con marcas, pagos, mensajes por
atender y las últimas publicaciones.

Secciones (cada una con su Manager + formulario):

| Sección | Qué controla |
| --- | --- |
| Hero | Portada: nombre, título, descripción, foto, CTAs. Incluye **vista previa en vivo** mientras se edita. |
| Media kit | Las cifras junto al Hero (seguidores, colaboraciones, calificación). |
| Feed | Tarjetas de fotos/videos, en dos modos: "Post de red social" o "Foto de portafolio" (foto propia sin red social, con marca opcional). Ver "el problema conocido con TikTok" abajo. |
| Feed / Publicaciones | Tarjetas con métricas (vistas, likes, comentarios, compartidos, guardados; el engagement se calcula), comentario destacado "Lo que dicen", filtros por tipo, "☆ Destacar" para Colaboraciones y "↻ Sincronizar métricas" desde Instagram/TikTok/Facebook conectados (`lib/social/metrics-sync.ts`, empareja por el link del post; de paso rellena o renueva la miniatura si está vacía o caducada). |
| Vista pública | El sitio dentro del panel (iframe), en escritorio o celular y ES/EN. |
| Crear | Composer de publicaciones: tipo, redes, marca, caption con **sugerencias de IA** (Claude, 3 opciones con el contexto de la persona creadora), avisos de límites por red, vista previa por red, consejos de IA por red y programación por día/hora (`APP_TIMEZONE`). Aún no publica automáticamente. |
| Calendario | Vista mensual con las publicaciones por red, "¿Ya las publicaste?" para las vencidas, próximas publicaciones y "Marcar publicada". |
| Metas y plan | Metas con valor actual y objetivo (manuales o automáticas: seguidores de cada red conectada, publicaciones del mes), promedio general con frase motivadora del día y plan de acción semanal con tareas que se pueden traer de semanas anteriores. |
| Bitácora | Línea de hitos y aprendizajes, diario de contenido y racha de días activos (entradas, tareas completadas y publicaciones nuevas). |
| Marcas | Dos pestañas: **Tratos** (CRM de colaboraciones: estado del trato, contacto, valor, paquete, plataformas, próximo paso con fecha, pago, notas e historial automático) y **Carrusel del sitio** (orden y visibilidad de los logos). Los datos del trato nunca llegan al sitio público. También se pueden crear marcas desde el formulario del Feed (modo Foto UGC). |
| Reseñas destacadas | Reseñas de producto con calificación en estrellas. |
| Cómo trabajo | Servicios ofrecidos, con ícono. |
| Paquetes | Paquetes de colaboración (sin precios). |
| Testimonios | Citas de marcas. |
| FAQ | Preguntas frecuentes (acordeón). |
| Contacto | Redes, email, WhatsApp y textos del pie de página. |
| Bandeja | Mensajes del formulario y comentarios recientes de Instagram (si está conectado) en una sola lista, con filtros, estado Pendiente/Respondido, etiqueta "Cliente" para marcas del CRM, aviso de +24 h y respuestas rápidas. Formulario: abre el correo prellenado (`mailto:`) y lo marca respondido. Instagram: responder, ocultar y borrar comentarios (`lib/social/instagram-comments.ts`, permiso `instagram_business_manage_comments`). Los DMs quedan para después (requieren la revisión de Meta). |
| Reportes | Seguidores totales y crecimiento de 30 días (historial diario en `FollowerSnapshot`), engagement promedio, publicaciones del mes, mejor día/franja para publicar, ingresos por marca, reporte mensual imprimible (`/admin/reportes/mensual`) y enlace al media kit público (`/media-kit`). |
| Apariencia | Foto, nombre, bio ES/EN y color de acento del sitio y del panel (6 opciones, `lib/theme.ts`; se aplica con variables CSS `--accent*`). |
| Conectar cuentas | Login oficial (OAuth) con Instagram, Facebook, TikTok y YouTube, con botón **Probar** que trae el perfil y las publicaciones recientes, y prueba de conexión con Claude (IA). Los tokens se guardan cifrados (`lib/token-crypto.ts`). Guía de configuración: [`docs/conectar-cuentas.md`](docs/conectar-cuentas.md). |
| **Manual de uso** | Documentación completa del panel, bilingüe (ES/EN): primera vez, glosario, paso a paso de Feed/reels, y guía por sección. Vive en `/admin/ayuda`. |

Notas útiles:

- Casi todo campo de texto tiene su par ES/EN (`components/admin/BilingualTextField.tsx`)
  — el inglés es opcional y cae de vuelta al español si se deja vacío.
- Las listas se reordenan con las flechas ↑ ↓; el orden se refleja tal cual
  en el sitio público.
- Los cambios se reflejan al instante en el sitio público, sin rebuild ni
  redeploy manual.
- **El problema conocido con TikTok**: TikTok bloquea la reproducción del
  embed de forma inconsistente (pantalla negra o error, tanto en mobile como
  en escritorio) — no es un bug de este sitio, es una restricción de TikTok.
  La solución es subir el video propio en el formulario de la tarjeta del
  Feed: el sitio reproduce ese archivo directo en vez de depender del embed.
  Todo el detalle está en el Manual (`/admin/ayuda`, sección "Paso a paso:
  Reels y videos").

## Deploy en Vercel

1. Conecta el repo en Vercel y agrega una base de datos Postgres desde el
   dashboard (se usó Neon en este proyecto).
2. Configura las variables de entorno de la tabla de arriba en el proyecto
   de Vercel.
3. Corre las migraciones contra la base de producción:
   `DATABASE_URL="..." npx prisma migrate deploy`.
4. (Opcional) corre el seed contra producción con
   `DATABASE_URL="..." npm run db:seed`.

### Problema conocido: el Blob Store debe ser público

Vercel Blob crea el store con un nivel de acceso fijo (`public` o `private`)
elegido **al crearlo** — no es un ajuste que se pueda cambiar después desde
la configuración del store. Esta app siempre sube archivos con
`access: "public"` (las fotos/videos se muestran en el sitio público sin
login), así que si el store conectado al proyecto quedó creado como
`private`, **toda** subida de archivo falla con un 400 que el navegador
reporta como bloqueado por CORS (el mensaje real, solo visible en un `put()`
hecho del lado del servidor, es *"Cannot use public access on a private
store"*).

La solución es crear/conectar un Blob Store con acceso **Public** desde
Vercel (dashboard → proyecto → Storage → Create Database → Blob → Access:
Public) y usar el `PUBLIC_BLOB_READ_WRITE_TOKEN` que genera esa conexión
(ver tabla de variables de entorno arriba) — no el `BLOB_READ_WRITE_TOKEN`
que Vercel crea por defecto la primera vez, que puede quedar apuntando al
store privado.

### Problema conocido en el deploy: `P1002` (advisory lock de Postgres)

Es común que el build de Vercel falle con:

```
Error: P1002
Context: Timed out trying to acquire a postgres advisory lock
(SELECT pg_advisory_lock(72707369)). Timeout: 10000ms.
```

Esto pasa porque Neon (en el plan usado) a veces tarda en soltar el lock que
`prisma migrate deploy` toma durante el build — es intermitente y no está
relacionado con el código del commit. **La solución es reintentar el
deploy**: un commit vacío (`git commit --allow-empty -m "chore: reintentar
deploy"` seguido de `git push`) dispara un build nuevo que normalmente sí
adquiere el lock. Si el PR ya está mergeado, el commit vacío se hace
directo sobre `main`.
