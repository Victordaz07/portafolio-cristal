# Pendientes para hacer desde la PC

Lo que el código ya no puede resolver solo: cuentas, llaves y revisiones de terceros.
Regla de siempre: **nunca pegues llaves ni secretos en el chat ni en capturas**; cópialos directo de una pestaña a otra.

## 1. Base de datos para los previews (importante)
Hoy los previews de Vercel (cada PR) **no migran** para no tocar producción (`scripts/migrate.mjs`).
Para que cada preview tenga su propia base:
1. En Neon: crea una rama `preview` a partir de `main` (no borres ni reinicies `main`).
2. En Vercel → Settings → Environment Variables, **solo en el entorno Preview**:
   - `DATABASE_URL` y `DIRECT_URL` → los de la rama `preview` de Neon.
   - `DB_ENV` = `preview`.
3. En **Production** puedes agregar `DB_ENV` = `production` (opcional, es un seguro extra).

## 2. Meta / Instagram
1. En developers.facebook.com → tu app → Roles de la app → Evaluadores de Instagram: agrega **beyareaplus** y **alfonsorb07**.
2. Desde cada cuenta: instagram.com/accounts/manage_access/ → **Invitaciones de prueba** → Aceptar.
3. Comenta desde esas cuentas en un post de @foliocrew y revisa la **Bandeja** (ahora muestra un aviso si Meta está ocultando comentarios por el modo desarrollo).
4. Graba el video demo (conectar Instagram → Feed → Bandeja) y envía la revisión de la app **cuando tú lo confirmes**.
5. Antes del lanzamiento abierto: verificación del negocio en Meta Business.

## 3. TikTok
Cuando TikTok apruebe la app (está "In review"): en Vercel cambia `TIKTOK_CLIENT_KEY` y `TIKTOK_CLIENT_SECRET` de las llaves **Sandbox** a las de **Production** y vuelve a desplegar.

## 4. Límite mensual de IA (opcional)
Ya funciona con estos topes: Folio 60, Pro 300, Crew/cortesía 1000 sugerencias al mes.
Para cambiarlos sin tocar código, en Vercel: `AI_MONTHLY_LIMIT_FOLIO`, `AI_MONTHLY_LIMIT_PRO`, `AI_MONTHLY_LIMIT_CREW`.

## 5. Para crecer (cuando haya más usuarios)
- **Next.js 16**: `npm audit` marca avisos en Next 14 (la mayoría son DoS de servidores propios; en Vercel el riesgo es bajo). Es una actualización grande: hacerla en una rama aparte y probar todo.
- **Upstash Redis** (gratis para empezar): para que el límite de intentos de login sea compartido entre servidores. Pásame `UPSTASH_REDIS_REST_URL` y `_TOKEN` en Vercel (sin enseñar los valores) y lo conecto.
- **Sentry** (gratis para empezar): avisos de errores en producción. Crea el proyecto Next.js, pon `SENTRY_DSN` en Vercel y lo conecto.

## Ya confirmado
- `CRON_SECRET` y `TOKEN_ENCRYPTION_KEY` existen en Vercel.
- La CI de GitHub (`.github/workflows/ci.yml`) corre lint, tipos, tests y build en cada PR.
