# Portafolio Crislia UGC

Portafolio interactivo para Cristal Amalia Flores Bello (Crislia), creadora de
contenido UGC (beauty, skincare, hair, books, lifestyle), dirigido a marcas
que quieren contratar colaboraciones. Incluye sitio público (media kit, feed
de contenido, paquetes de precio, contacto) y un panel `/admin` protegido
para editar todo el contenido sin tocar código.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (tokens de diseño en `tailwind.config.ts`)
- Prisma + Postgres
- Auth de admin: cookie de sesión firmada (`jose`) + `bcryptjs`
- Subida de imágenes: Vercel Blob
- Envío de correo del formulario de contacto: Resend (opcional)
- Embeds reales de TikTok / Instagram / Facebook

## Requisitos previos

- Node.js 18+
- Una base de datos Postgres (Vercel Postgres, Neon, o cualquier Postgres).
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
| `BLOB_READ_WRITE_TOKEN` | Necesario para subir la foto del hero y logos de marcas. |

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
- `npx prisma migrate dev` — aplica el schema a la base de datos
- `npm run db:seed` — puebla la base con el contenido de ejemplo (`prisma/seed.ts`)

## Notas del panel `/admin`

- Todas las rutas bajo `/admin/*` y `/api/admin/*` (excepto login) están
  protegidas por `middleware.ts`.
- Las tarjetas del feed se agregan pegando la URL del post (TikTok,
  Instagram o Facebook); la plataforma y el tipo (video/foto) se detectan
  automáticamente y se puede cargar un preview con el embed real antes de
  guardar.
- Los datos del seed (`prisma/seed.ts`) incluyen URLs de ejemplo para las
  tarjetas del feed — reemplázalas desde el panel por los posts reales de
  Crislia.
- Los cambios se reflejan al instante en el sitio público, sin rebuild ni
  redeploy.

## Deploy en Vercel

1. Conecta el repo en Vercel y agrega una base de datos Postgres desde el
   dashboard (Vercel Postgres o Neon).
2. Configura las variables de entorno de la tabla de arriba en el proyecto
   de Vercel.
3. Corre las migraciones contra la base de producción:
   `DATABASE_URL="..." npx prisma migrate deploy`.
4. (Opcional) corre el seed contra producción con
   `DATABASE_URL="..." npm run db:seed`.
