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
- Subida de imágenes/video: Vercel Blob
- Envío de correo del formulario de contacto: Resend (opcional)
- Embeds reales de TikTok / Instagram / Facebook, con opción de subir video propio
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
| `BLOB_READ_WRITE_TOKEN` | Necesario para subir fotos, videos y logos de marcas. |

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

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npx tsc --noEmit` — chequeo de tipos
- `npx prisma migrate dev` — aplica el schema a la base de datos (local)
- `npx prisma migrate deploy` — aplica las migraciones pendientes (producción)
- `npm run db:seed` — puebla la base con el contenido de ejemplo (`prisma/seed.ts`)

## Sitio público

El sitio (`app/page.tsx`) es bilingüe: un botón **ES/EN** en el nav (escritorio
y mobile) guarda la preferencia en una cookie (`locale`) y recarga el
Server Component correspondiente — no hay rutas separadas `/es` / `/en`.
Cada campo de texto editable en la base de datos tiene una columna paralela
`xxxEn` (nullable, con respaldo automático al español si está vacía); los
strings de diseño fijos (nav, botones, labels) viven en `lib/i18n.ts`.

Secciones del sitio: Hero, Media kit, Feed (fotos/videos), Marcas, Reseñas
destacadas, Cómo trabajo, Paquetes, Testimonios, FAQ y Contacto.

Dos detalles ocultos, pensados como un pequeño gesto para Crislia:

- **Frases motivadoras**: tocar dos veces seguidas el destello bajo el título
  del Hero (mobile) o el corazón de "Tu apoyo significa todo" muestra una
  frase al azar (40 frases bilingües en `lib/motivational-phrases.ts`).
- **Crédito del diseñador**: un botón circular discreto (ícono de átomo) al
  final del footer abre una tarjeta con los datos de contacto de quien
  construyó el sitio (`components/CreatorCredit.tsx`, datos centralizados en
  `lib/creator-info.ts`).

## Panel `/admin`

Todas las rutas bajo `/admin/*` y `/api/admin/*` (excepto login) están
protegidas por `middleware.ts`. El shell (`components/admin/AdminShell.tsx`)
tiene un sidebar agrupado por íconos, colapsable en mobile, con badge de
mensajes sin leer.

Secciones (cada una con su Manager + formulario):

| Sección | Qué controla |
| --- | --- |
| Hero | Portada: nombre, título, descripción, foto, CTAs. Incluye **vista previa en vivo** mientras se edita. |
| Media kit | Las cifras junto al Hero (seguidores, colaboraciones, calificación). |
| Feed | Tarjetas de fotos/videos. Ver "el problema conocido con TikTok" abajo. |
| Marcas | Carrusel de logos, con estado activo/inactivo. |
| Reseñas destacadas | Reseñas de producto con calificación en estrellas. |
| Cómo trabajo | Servicios ofrecidos, con ícono. |
| Paquetes | Paquetes de colaboración (sin precios). |
| Testimonios | Citas de marcas. |
| FAQ | Preguntas frecuentes (acordeón). |
| Contacto | Redes, email, WhatsApp y textos del pie de página. |
| Mensajes | Buzón de mensajes recibidos desde el formulario del sitio. |
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
