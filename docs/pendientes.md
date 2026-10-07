# Pendientes para hacer desde la PC

Lo que el código ya no puede resolver solo: cuentas, llaves y revisiones de terceros.
Regla de siempre: **nunca pegues llaves ni secretos en el chat ni en capturas**; cópialos directo de una pestaña a otra.

## 1. Base de datos para los previews (pospuesto, no urgente)
Revisado el 5 de octubre: la integración nativa de Neon en Vercel (recurso `neon-chestnut-lens`) inyecta sus variables
en Production **y** Preview, y no crea ramas por preview. El código solo lee `DATABASE_URL` y `DIRECT_URL`.

Hoy los previews usan la base de producción, pero **nunca migran** (`scripts/migrate.mjs` lo impide sin `DB_ENV=preview`).
Es suficiente mientras solo tú abras los previews. Cuando entre más gente al equipo:
1. En Neon (Open in Neon Console): crea la rama `preview` a partir de `main`. No toques `main`.
2. En Vercel → Storage → `neon-chestnut-lens` → Settings → Allowed Environments: deja **solo Production**.
3. En Vercel → Environment Variables, **solo Preview**: `DATABASE_URL` (pooled de la rama preview),
   `DIRECT_URL` (directa de la rama preview) y `DB_ENV` = `preview`. Quita Preview del `DIRECT_URL` actual.

## 2. Meta / Instagram
1. En developers.facebook.com → tu app → Roles de la app → Evaluadores de Instagram: agrega **beyareaplus** y **alfonsorb07**.
2. Desde cada cuenta: instagram.com/accounts/manage_access/ → **Invitaciones de prueba** → Aceptar.
3. Comenta desde esas cuentas en un post de @foliocrew y revisa la **Bandeja** (ahora muestra un aviso si Meta está ocultando comentarios por el modo desarrollo).
4. Graba el video demo (conectar Instagram → Feed → Bandeja) y envía la revisión de la app **cuando tú lo confirmes**.
5. Antes del lanzamiento abierto: verificación del negocio en Meta Business.
9. **Mérito automático de embajadoras (G5):** apagado a propósito mientras haya pocas usuarias. Cuando quieras prenderlo: en Vercel agrega `AMBASSADOR_MERIT_ENABLED=1`; desde ese momento toda cuenta ve «Invita y gana» y sube sola al nivel con 5 referidos que paguen. La sección pública «Embajadoras» de la página de Foliocrew ya funciona: aparece cuando una embajadora elige mostrarse.
8. **Avisos en el celular (E5):** el código ya está, apagado hasta que pongas las llaves. En tu computadora ejecuta `npx web-push generate-vapid-keys` (te da una llave pública y una privada; **no las pegues en el chat**). En Vercel agrega `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y, si quieres, `VAPID_SUBJECT` (por ejemplo `mailto:soporte@foliocrew.pro`) y vuelve a desplegar. Luego cada persona entra a «Avisos en el celular» y toca «Activar avisos».
7. **Publicación automática (E2):** el código ya está, apagado. Cuando Meta apruebe `instagram_business_content_publish` y `pages_manage_posts` (misma revisión de la app; no se envía sin tu confirmación): en Vercel agrega `PUBLISH_INSTAGRAM_ENABLED=1` y/o `PUBLISH_FACEBOOK_ENABLED=1` y cada creadora reconecta la red. Para que salga **a la hora exacta** (la tarea diaria solo es red de seguridad), programa en un servicio gratuito (por ejemplo cron-job.org o GitHub Actions) una llamada cada 5–10 minutos a `https://foliocrew.pro/api/cron/publish` con la cabecera `Authorization: Bearer <tu CRON_SECRET>` (sin mostrar la clave aquí).
6. **Comentario → DM (C6):** el código ya está, pero apagado. Cuando Meta apruebe el permiso `instagram_business_manage_messages` (va en la misma revisión de la app; no se envía sin tu confirmación): en Vercel agrega `INSTAGRAM_DM_ENABLED=1` y `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` (un texto que inventes; sin mostrarlo), registra en Meta el webhook de Instagram `https://foliocrew.pro/api/social/instagram/webhook` con ese mismo texto y suscribe el campo `comments`; luego reconecta Instagram para autorizar mensajes.

## 3. TikTok
Cuando TikTok apruebe la app (está "In review"): en Vercel cambia `TIKTOK_CLIENT_KEY` y `TIKTOK_CLIENT_SECRET` de las llaves **Sandbox** a las de **Production** y vuelve a desplegar.

## 4. Límite mensual de IA (opcional)
Ya funciona con estos topes: Folio 60, Pro 300, Crew/cortesía 1000 sugerencias al mes.
Para cambiarlos sin tocar código, en Vercel: `AI_MONTHLY_LIMIT_FOLIO`, `AI_MONTHLY_LIMIT_PRO`, `AI_MONTHLY_LIMIT_CREW`.
Modelo: por defecto `claude-sonnet-5-5` (la mitad de precio que Opus). Para cambiarlo, variable `AI_MODEL` en Vercel.

## 5. Para crecer (cuando haya más usuarios)
- **Next.js 16**: `npm audit` marca avisos en Next 14 (la mayoría son DoS de servidores propios; en Vercel el riesgo es bajo). Es una actualización grande: hacerla en una rama aparte y probar todo.
- **Upstash Redis** (gratis para empezar): para que el límite de intentos de login sea compartido entre servidores. Pásame `UPSTASH_REDIS_REST_URL` y `_TOKEN` en Vercel (sin enseñar los valores) y lo conecto.
- **Sentry** (gratis para empezar): avisos de errores en producción. Crea el proyecto Next.js, pon `SENTRY_DSN` en Vercel y lo conecto.

## Ya confirmado
- `CRON_SECRET` y `TOKEN_ENCRYPTION_KEY` existen en Vercel.
- La CI de GitHub (`.github/workflows/ci.yml`) corre lint, tipos, tests y build en cada PR.

## Cumplimiento legal (auditoría del 7 de octubre)
El código ya quedó listo; esto es lo que solo tú puedes hacer:
1. **Dirección postal:** en Vercel agrega `LEGAL_POSTAL_ADDRESS` (una línea; sirve un PO Box, para no publicar la de tu casa) y vuelve a desplegar. Sale al pie de los correos y en `/terminos`.
2. **Agente de derechos de autor (DMCA):** regístralo en https://dmca.copyright.gov (cuesta unos 6 dólares y se renueva cada 3 años) con el mismo correo de `LEGAL_CONTACT_EMAIL` y la misma dirección postal. Sin ese registro, la sección 9 de los términos no te da la protección de "puerto seguro".
3. **Correo legal:** confirma que `LEGAL_CONTACT_EMAIL` está en Vercel y que alguien lee ese buzón (ahí llegan los avisos de derechos de autor y de privacidad).
4. **Revisión de un abogado:** los textos de `/privacidad` y `/terminos` son una base razonable, no asesoría legal.
5. **Cuando conectes Stripe con renovación automática:** antes de cobrar hay que mostrar precio, frecuencia y cómo cancelar junto al botón de pago, pedir consentimiento expreso y dejar cancelar en línea tan fácil como fue suscribirse. Hoy no aplica porque los pagos son manuales y no se renuevan solos.

## Seguridad (7 de octubre)
Guía completa y plan de respuesta a incidentes: `docs/seguridad.md`.
1. **Activa tu verificación en dos pasos** en Mi cuenta y guarda los códigos de recuperación en tu gestor de contraseñas. Pídesela también a quien tenga rol en el equipo.
2. **Dos pasos en las cuentas de fuera:** GitHub, Vercel, Neon, Resend, el registrador del dominio, las consolas de Meta/TikTok/Google, PayPal y tu correo de administración.
3. **Neon:** confirma que la restauración a un punto en el tiempo está activa.
4. **GitHub:** protege la rama `main`.

