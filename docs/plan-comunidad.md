# Plan: Comunidad Foliocrew (el "LinkedIn de los creadores")

> **Este es el detalle de la Comunidad (bloque A y D).** El camino completo está en `docs/plan-maestro.md`: empieza por ahí.
>
> **Si eres otra sesión de Claude retomando este trabajo:** lee este archivo completo antes de tocar código.
> 1. Mira la sección **Estado** (abajo) y sigue con el primer paso sin marcar.
> 2. Cada paso es un PR pequeño. Al terminarlo, marca su casilla **en este archivo y en `docs/plan-maestro.md`** dentro del mismo PR.
> 3. Responde siempre en **español**. La persona dueña del proyecto está aprendiendo ("vibe coding"): explica en simple, sin jerga.
> 4. Respeta las **Reglas del proyecto** (sección 2). No son opcionales.

---

## Estado

**Etapa 1: Muro de la comunidad**
- [x] Paso 1: Modelos y migración (CommunityProfile, CommunityPost, CommunityReply, CommunityReaction, CommunityReport, CommunityBlock) + rol de equipo `community`
- [x] Paso 2: Perfil de comunidad (crear/editar, armado con los datos de Foliocrew) + página pública del perfil dentro del panel
- [x] Paso 3: Muro: publicar, listar con filtros, ver una publicación con sus respuestas
- [x] Paso 4: Respuestas, "me sirvió", "mejor respuesta" y reputación
- [x] Paso 5: Reportar, bloquear y moderación (Departamento de Comunidad en el Centro de mando)
- [x] Paso 6: Avisos (correo + contador en el menú) y reglas de la comunidad
- [x] Paso 7: Pregunta de la semana con IA + sembrado inicial + lanzamiento

> **Etapa 1 terminada en código.** Pendiente de personas (no de código):
> - Sembrar 8–10 publicaciones reales del equipo (las escribe el dueño o Cristal desde su cuenta; nada inventado como si fuera de otros).
> - Dar el rol **Comunidad** a Cristal en Equipo → Personas (si el dueño lo confirma).
> - La pregunta de la semana se publica sola en el cron diario de Inteligencia (`/api/cron/insights`) si no hubo una en 6 días;
>   el equipo también puede publicarla al momento desde Equipo → Comunidad. Sin `ANTHROPIC_API_KEY` usa preguntas de respaldo.

**Etapa 2: Conexiones y mensajes** (detalle en la sección 8)
- [x] Paso 8: Conexiones (solicitar / aceptar / rechazar / quitar) + página Conexiones + avisos
- [x] Paso 9: Mensajes directos 1 a 1 entre conexiones (se actualiza cada 10 s)
- [x] Paso 10: Buscar colaboradores (tipo de creador, nicho, ciudad, idioma, abierto a colaborar)

> **Etapa 2 terminada.** Los mensajes se actualizan cada 10 s; si hay mucho volumen, pasar a tiempo real
> (Pusher/Ably/Supabase Realtime) pidiendo la llave al dueño **sin** que la muestre en el chat.

**Etapa 3: Lo que la hace única** (después)
- [ ] Círculos (grupos por nicho, red o nivel)
- [ ] Reseñas anónimas de marcas
- [ ] Mentorías y sesiones en vivo (plan Crew)

---

## 1. Qué es y para quién

Un espacio **dentro del panel de Foliocrew** donde creadores de **todo tipo** se dan consejos, comparten logros, piden ayuda y buscan colaboraciones.
No es solo para UGC: YouTube, TikTok, Instagram, Facebook, podcast, streaming (Twitch/Kick), UGC, fotografía, blog/escritura, X/Threads, LinkedIn.

**Por qué:** retiene a los usuarios (amigos y reputación no se mudan a otra app) y trae nuevos (cada creador invita a otros).

**Riesgo principal:** una red vacía se siente muerta. Por eso la etapa 1 es un **muro** (no un chat), solo para cuentas de Foliocrew,
y se siembra con publicaciones del equipo + la pregunta de la semana con IA (paso 7).

**Lenguaje:** inclusivo y neutro ("creadores", "quien crea", "te damos la bienvenida"). Nunca solo femenino.
Ver `docs/foliocrew-contexto-para-gpt.md` (sección LENGUAJE INCLUSIVO).

---

## 2. Reglas del proyecto (obligatorias)

### Seguridad y personas
- **Nunca** pidas, muestres ni pegues llaves, contraseñas o secretos en el chat ni en capturas. Si hay que copiar una llave, se copia directo de una pestaña a otra.
- **Nunca** pidas ni manejes el SSN/ITIN ni datos bancarios del dueño.
- No hagas compras sin aprobación explícita. No envíes revisiones de apps (Meta, TikTok, Google) sin confirmación.
- No borres ni reinicies la rama `main` de Neon ni valores de producción. Con el MCP de Vercel, nunca descifres variables.
- Datos personales (nombre, dirección) **no** se suben al repo.
- No pongas identificadores de modelos de IA en commits, PRs ni código.

### Stack
- Next.js **14.2.35** App Router (en páginas y rutas: `await params` y `await searchParams`, son Promises).
- Prisma **6.19** sobre Neon Postgres. Vercel. Tailwind. zod v4. Resend (correo). Sesiones con `jose`.
- Fuentes **locales** en `app/fonts` con `next/font/local` (no usar Google Fonts al compilar: rompe el build sin red).
- IA: `lib/ai.ts`, modelo por defecto `process.env.AI_MODEL || "claude-sonnet-5-5"`. Hay límite mensual por plan (`AiUsage`).

### Base de datos: MUY importante
- `prisma` (de `@/lib/prisma`) **filtra solo por cuenta** los modelos de `TENANT_MODELS` (`lib/prisma.ts`): agrega `creatorId` en where/create.
- `prismaRoot` (de `@/lib/prisma-root`) no filtra nada.
- **La comunidad es entre cuentas**, así que sus modelos **NO** van en `TENANT_MODELS`. Usa `prismaRoot` y valida tú los permisos
  (quién es el autor, quién puede borrar, etc.).
- Migraciones: edita `prisma/schema.prisma`, luego genera el SQL con
  `npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<fecha>_<nombre>/migration.sql`.
  Revisa el SQL y **quita líneas ajenas** (a veces aparece un `ALTER TABLE "Brand" ... DROP DEFAULT` que no es tuyo).
  Aplica local con `npx prisma migrate deploy`. En producción la migración corre sola en el build (`scripts/migrate.mjs`).

### Sesión, roles y helpers que ya existen
- `getSession()` (`lib/tenant.ts`) → `{ creatorId, userId, actorId }`. `actorId` existe cuando alguien del equipo está "entrando como" otra cuenta.
  **En la comunidad, si hay `actorId`, no se puede publicar ni reaccionar** (el equipo no habla en nombre de la cuenta).
- Equipo: `lib/team.ts` (`teamUser()`, `hasRole()`, `requireRole()`, `requireOwner()`, `teamEmailsWith(role)`), roles en `lib/team-roles.ts`.
- Dueño: variable `PLATFORM_ADMIN_EMAILS`. Registro de acciones: `logPlatformAction()` en `lib/platform-admin.ts`.
- Correos: `sendEmail()` (`lib/email.ts`) + `noticeEmail()` (`lib/email-templates.ts`) + `platformOrigin()` (`lib/site-url.ts`). Siempre en try/catch: un correo que falla no rompe la acción.
- Límite de intentos: `tooManyAttempts(key, max, windowMs)` (`lib/rate-limit.ts`).
- Subir imágenes: `/api/admin/upload` (Vercel Blob, `lib/upload-limits.ts`).
- UI del panel: `components/admin/PageHeader`, `Card`, `useToast` (`ToastContext`), clases en `lib/admin-ui.ts`
  (`inputClass`, `labelClass`, `primaryButtonClass`, `secondaryButtonClass`, `dangerLinkClass`). Colores Tailwind: `ink`, `cream`, `coral`, `line`, `sage`, `lime`, `cobalt-ink`.
- Menú lateral: `components/admin/AdminShell.tsx` (`NAV_GROUPS`, `departmentItems`, `foliocrewGroup`). Contadores con `badgeKey`, calculados en `app/admin/(dashboard)/layout.tsx`.
- Ejemplos para copiar el estilo: centro de soporte (`app/admin/(dashboard)/soporte`, `app/admin/(dashboard)/equipo/soporte`, `app/api/admin/support`) e ideas (`app/admin/(dashboard)/ideas`, `components/admin/IdeaForm.tsx`).

### Comprobaciones antes de cada commit
```
npm run lint
npx tsc --noEmit        # ignora errores TS6053
npm test
npm run build
```

### Probar en local
- Postgres local (si no responde):
  `rm -f /var/tmp/cristal-pg/data/postmaster.pid; (cd /tmp && su postgres -c "/usr/lib/postgresql/*/bin/pg_ctl -D /var/tmp/cristal-pg/data -o '-p 5433 -k /var/tmp/cristal-pg' -l /var/tmp/cristal-pg/log.txt start")`
- Variables: `set -a; . ./.env; set +a`
- Servidor: `(setsid nohup npm run dev > /tmp/dev.log 2>&1 < /dev/null &)`; para apagarlo, `pkill -f "next dev"` en otra llamada.
- Cuentas de prueba locales: `cristal@prueba.local` (Dueño) y `vic@prueba.local`, contraseña `cristal-1234`. Login por API: `POST /api/admin/login {email,password}`.
- Playwright ya está instalado (Chromium en `/opt/pw-browsers`). No ejecutes `playwright install`.
- Borra los datos de prueba al terminar.
  (Si el entorno es otro y no existe esa base local, usa una base de Postgres propia; **nunca** pruebes contra producción.)

### Flujo de Git (cada paso)
1. Rama de trabajo (la que indique la sesión). Commit con mensaje en español.
2. Push y PR **en borrador** con descripción en español.
3. Espera el estado **Vercel** y el check **check** (CI: lint, tipos, tests, build con migraciones en base vacía).
4. Cuando todo esté verde: quitar borrador → **squash merge** con título "… (#N)".
5. Sincroniza la rama con `main` y verifica en producción (https://foliocrew.pro).

---

## 3. Decisiones de diseño (etapa 1)

| Tema | Decisión |
|---|---|
| Quién entra | Cualquier cuenta de Foliocrew con sesión, **activa** (no pausada) y con correo confirmado para publicar (leer sí sin confirmar). |
| Identidad | Un **perfil de comunidad por cuenta** (`CommunityProfile`, 1 por `creatorId`). Se arma con datos que ya existen (nombre, foto del Hero, ciudad, nicho, redes conectadas, enlace a su sitio). Se puede editar. |
| Usuario visible | `@handle` = el `slug` de la cuenta (ya es único). |
| Tipos de creador | Lista múltiple: `youtube, tiktok, instagram, facebook, podcast, streaming, ugc, fotografia, escritura, x_threads, linkedin, otro`. |
| Tipos de publicación | `pregunta`, `consejo`, `logro`, `colaboracion` (busco colaborar), `recurso`. |
| Temas | `crecimiento`, `marcas_y_dinero`, `contenido_y_edicion`, `herramientas`, `bienestar`, `legal_e_impuestos`, `otro`. |
| Formato | Texto (título 5–140, cuerpo 10–5000), hasta 1 imagen opcional (paso 3, usando `/api/admin/upload`), enlaces automáticos. Sin HTML: se muestra como texto con saltos de línea. |
| Orden del muro | Pestañas: **Recientes** (por fecha) y **Destacadas** (score = me sirvió + respuestas, con caída por antigüedad). Filtros: tipo de publicación, tema, tipo de creador. |
| Reputación | +2 por cada "me sirvió" recibido, +10 por "mejor respuesta". Se muestra en el perfil (no se resta). Niveles: Nuevo (0), Activo (20), Aporta (100), Referente (300). |
| Mejor respuesta | Solo en publicaciones tipo `pregunta`; la elige quien preguntó. |
| Editar / borrar | El autor puede editar 30 min después de publicar; borrar siempre (borrado suave: `deletedAt`). |
| Moderación | Nuevo rol de equipo **`community`** ("Comunidad"). Ve reportes, oculta publicaciones o respuestas, pausa la participación de una cuenta. Todo queda en `PlatformAction`. |
| Bloquear | Si A bloquea a B, A deja de ver lo de B y B no puede responderle a A. |
| Límites anti-spam | Publicar: 5 por hora. Responder: 30 por hora. Reportar: 20 por hora. Cuentas con menos de 24 h: 2 publicaciones el primer día. |
| Equipo "entrando como" | Puede **leer** para dar soporte, nunca publicar ni reaccionar. |
| Privacidad | La comunidad **no es pública**: solo dentro del panel. El perfil muestra lo que la persona elija (`showCity`, `showSite`). Nada de correos visibles. |

---

## 4. Modelo de datos (paso 1)

Agrega a `prisma/schema.prisma` (y en `Creator`, las relaciones `communityProfile CommunityProfile?`, `communityPosts CommunityPost[]`, `communityReplies CommunityReply[]`).
**No** agregues estos modelos a `TENANT_MODELS`.

```prisma
/// Perfil de comunidad de una cuenta (1 por cuenta). Se arma con los datos de Foliocrew.
model CommunityProfile {
  id           String   @id @default(cuid())
  creatorId    String   @unique
  creator      Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  displayName  String
  headline     String   @default("")   // "Creo videos de cocina saludable en TikTok"
  bio          String   @default("")
  avatarUrl    String?
  city         String?
  showCity     Boolean  @default(true)
  showSite     Boolean  @default(true)
  creatorTypes String[] @default([])    // lib/community.ts → CREATOR_TYPES
  niche        String?                  // id de lib/onboarding.ts → NICHES
  languages    String[] @default(["es"])
  openToCollab Boolean  @default(false)
  reputation   Int      @default(0)
  /// Moderación: la cuenta no puede publicar ni responder hasta esta fecha
  mutedUntil   DateTime?
  acceptedRulesAt DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  posts        CommunityPost[]
  replies      CommunityReply[]

  @@index([niche])
}

model CommunityPost {
  id          String   @id @default(cuid())
  creatorId   String
  creator     Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  profileId   String
  profile     CommunityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  kind        String   // "pregunta" | "consejo" | "logro" | "colaboracion" | "recurso"
  topic       String   @default("otro")
  title       String
  body        String
  imageUrl    String?
  creatorTypes String[] @default([])   // a qué tipo de creador va dirigido (para filtrar)
  helpfulCount Int     @default(0)
  replyCount  Int      @default(0)
  bestReplyId String?
  pinned      Boolean  @default(false) // el equipo fija la pregunta de la semana
  fromTeam    Boolean  @default(false)
  hiddenAt    DateTime?                // oculto por moderación
  hiddenBy    String?
  deletedAt   DateTime?                // borrado por el autor
  lastActivityAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  replies     CommunityReply[]

  @@index([createdAt])
  @@index([lastActivityAt])
  @@index([kind, topic])
  @@index([creatorId])
}

model CommunityReply {
  id           String   @id @default(cuid())
  postId       String
  post         CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  creatorId    String
  creator      Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  profileId    String
  profile      CommunityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  body         String
  helpfulCount Int      @default(0)
  hiddenAt     DateTime?
  hiddenBy     String?
  deletedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([postId, createdAt])
  @@index([creatorId])
}

/// "Me sirvió": una por cuenta y por publicación o respuesta.
model CommunityReaction {
  id         String   @id @default(cuid())
  creatorId  String
  targetType String   // "post" | "reply"
  targetId   String
  createdAt  DateTime @default(now())

  @@unique([creatorId, targetType, targetId])
  @@index([targetType, targetId])
}

model CommunityReport {
  id         String    @id @default(cuid())
  reporterId String    // creatorId de quien reporta
  targetType String    // "post" | "reply" | "profile"
  targetId   String
  reason     String    // "spam" | "ofensivo" | "estafa" | "otro"
  detail     String    @default("")
  status     String    @default("open") // "open" | "actioned" | "dismissed"
  handledBy  String?
  createdAt  DateTime  @default(now())
  resolvedAt DateTime?

  @@index([status, createdAt])
  @@unique([reporterId, targetType, targetId])
}

model CommunityBlock {
  id        String   @id @default(cuid())
  blockerId String   // creatorId
  blockedId String   // creatorId
  createdAt DateTime @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockedId])
}
```

En `lib/team-roles.ts` agrega el rol:
```ts
{ id: "community", label: "Comunidad", hint: "Modera la comunidad: revisa reportes, oculta publicaciones y pausa cuentas que rompen las reglas." }
```
(El Dueño lo tiene automáticamente porque `teamRolesFor` le da todos los roles.)

---

## 5. Archivos a crear

```
lib/community.ts                     → constantes (CREATOR_TYPES, POST_KINDS, TOPICS, niveles), helpers puros (score, nivel por reputación)
lib/community-server.ts              → myProfile(), ensureProfile() (crea el perfil con datos de Hero/SocialAccount/Creator),
                                       canParticipate(session), blockedIds(creatorId), feedQuery(filtros)
tests/community.test.ts              → pruebas de las funciones puras (score, nivel, validaciones)

app/admin/(dashboard)/comunidad/page.tsx              → muro (pestañas, filtros, botón "Publicar")
app/admin/(dashboard)/comunidad/NewPostForm.tsx       → formulario (cliente)
app/admin/(dashboard)/comunidad/[id]/page.tsx         → publicación + respuestas
app/admin/(dashboard)/comunidad/[id]/ReplyForm.tsx
app/admin/(dashboard)/comunidad/perfil/page.tsx       → editar mi perfil (primera vez: bienvenida + aceptar reglas)
app/admin/(dashboard)/comunidad/perfil/ProfileForm.tsx
app/admin/(dashboard)/comunidad/creador/[handle]/page.tsx → perfil de otra persona
app/admin/(dashboard)/comunidad/reglas/page.tsx       → reglas de la comunidad
components/community/PostCard.tsx, AuthorBadge.tsx, HelpfulButton.tsx, ReportButton.tsx

app/api/admin/community/profile/route.ts              → GET mío / PUT editar
app/api/admin/community/posts/route.ts                → POST crear
app/api/admin/community/posts/[id]/route.ts           → PATCH editar (30 min) / DELETE (suave)
app/api/admin/community/posts/[id]/replies/route.ts   → POST responder
app/api/admin/community/replies/[id]/route.ts         → PATCH/DELETE propia
app/api/admin/community/react/route.ts                → POST alternar "me sirvió" {targetType,targetId}
app/api/admin/community/posts/[id]/best/route.ts      → POST marcar mejor respuesta {replyId}
app/api/admin/community/report/route.ts               → POST reportar
app/api/admin/community/block/route.ts                → POST/DELETE bloquear

app/admin/(dashboard)/equipo/comunidad/page.tsx       → moderación (rol community)
app/api/admin/team/community/reports/[id]/route.ts    → PATCH resolver reporte (ocultar contenido / descartar / pausar cuenta N días)
```

**Menú:** agrega en `NAV_GROUPS` (AdminShell) un grupo nuevo **"Comunidad"** arriba de "Ayuda" con: Muro (`/admin/comunidad`), Mi perfil (`/admin/comunidad/perfil`).
Y en `departmentItems()` el departamento "Comunidad" (`/admin/equipo/comunidad`, rol `community`, con contador de reportes abiertos).
Agrega la tarjeta en `app/admin/(dashboard)/equipo/page.tsx` y en `app/admin/(dashboard)/plataforma/DepartmentsSection.tsx`.

---

## 6. Reglas de cada API

Todas: `export const dynamic = "force-dynamic"`, validación con zod, errores en español, `{ error }` con su status.

- **Participar** (`canParticipate`): hay sesión, **sin** `actorId`, cuenta `status = "active"`, correo confirmado (`AdminUser.emailVerifiedAt`),
  perfil creado con `acceptedRulesAt`, y `mutedUntil` vencido o nulo. Si falla, responde 403 con el motivo exacto
  ("Confirma tu correo para publicar", "Acepta las reglas de la comunidad", etc.).
- **Crear publicación:** límites del punto 3. Guarda `lastActivityAt`. Si `kind = colaboracion`, pide `creatorTypes` destino.
- **Responder:** no se puede si la publicación está oculta/borrada o si el autor de la publicación bloqueó a quien responde.
  Sube `replyCount` y `lastActivityAt` en una **transacción**.
- **Me sirvió:** alterna (crea o borra la reacción) y ajusta `helpfulCount` y la `reputation` del autor (+2 / −2) en una transacción.
  No se puede reaccionar a lo propio.
- **Mejor respuesta:** solo el autor de una `pregunta`. Si cambia de respuesta, resta los +10 a la anterior y los suma a la nueva.
- **Reportar:** uno por persona y contenido. Avisa por correo a `teamEmailsWith("community")` cuando un contenido llega a **3 reportes**
  o si el motivo es `estafa`. Con 5 reportes abiertos, el contenido se **oculta solo** hasta que el equipo lo revise.
- **Moderación (rol community):** ocultar/mostrar, descartar reporte, pausar a una cuenta 1/7/30 días (`mutedUntil`). Registra con
  `logPlatformAction(email, "community", creatorId, detalle)`. Avisa por correo a la persona si se oculta su contenido o se pausa.
- **Leer el muro:** excluye `hiddenAt`, `deletedAt` y las cuentas que bloqueé o que me bloquearon. Paginación por cursor (20 por página).

---

## 7. Pasos detallados

### Paso 1: Modelos y migración
- Esquema de la sección 4 + migración `prisma/migrations/<AAAAMMDDhhmmss>_comunidad/`.
- Rol `community` en `lib/team-roles.ts`.
- `lib/community.ts` con las constantes y funciones puras + `tests/community.test.ts`.
- **Listo cuando:** lint, tsc, test y build pasan; la migración aplica en base vacía (lo prueba la CI).

> **Hecho en el paso 1:** además de lo de arriba, `CommunityProfile` ya trae `emailNotify` y `lastSeenAt` (del paso 6),
> para no hacer otra migración después. `lib/community.ts` tiene todas las etiquetas en español **e inglés**
> (el panel es bilingüe: usa `useT()` / `getT()` y los helpers `postKindLabel(id, lang)`, `topicLabel`, `creatorTypeLabel`, `levelLabel`).

### Paso 2: Perfil
- `ensureProfile(creatorId)`: si no existe, lo crea con `Hero.name`, `Hero.photoUrl`, `Hero.location`, el nicho
  (buscar el id en `NICHES` comparando con `Hero.niche`), y `creatorTypes` según las redes conectadas (`SocialAccount.platform`)
  + `ugc` si `Creator.creatorKind` es `ugc` o `ambos`.
- Página "Mi perfil" con bienvenida la primera vez: qué es la comunidad, 5 reglas cortas, botón "Acepto y entro" (`acceptedRulesAt`).
- Página de perfil ajeno (`/admin/comunidad/creador/[handle]`): foto, nombre, headline, tipos, nicho, nivel, reputación,
  enlace a su sitio (si `showSite`), sus últimas publicaciones, botones Reportar y Bloquear.
- **Listo cuando:** una cuenta nueva entra a Comunidad, ve su perfil ya armado, lo edita y acepta las reglas.

### Paso 3: Muro
- `/admin/comunidad`: pestañas Recientes y Destacadas, filtros (tipo de publicación, tema, tipo de creador), "Cargar más".
- Publicación fijada arriba (`pinned`).
- `NewPostForm`: tipo (con ejemplos de qué escribir en cada uno), tema, título, texto y una imagen opcional.
- Página de la publicación con autor, fecha relativa, contenido, respuestas.
- **Listo cuando:** dos cuentas distintas publican y se ven mutuamente; los filtros funcionan; móvil se ve bien (390 px).

### Paso 4: Respuestas y reputación
- Responder, editar (30 min), borrar. "Me sirvió" en publicación y respuestas. "Mejor respuesta" en preguntas.
- Nivel y reputación visibles junto al nombre (`AuthorBadge`).
- **Listo cuando:** los contadores y la reputación cuadran después de dar y quitar "me sirvió" varias veces.

### Paso 5: Moderación
- Reportar (publicación, respuesta, perfil) y bloquear/desbloquear.
- Departamento **Comunidad** en `/admin/equipo/comunidad`: reportes abiertos con el contenido, acciones y historial.
- Agregarlo al menú del equipo y a la pestaña Departamentos del Centro de mando.
- **Listo cuando:** un reporte llega al departamento, el equipo oculta el contenido, el autor recibe correo y el muro ya no lo muestra.

### Paso 6: Avisos y reglas
- Correo cuando alguien responde mi publicación o marca mi respuesta como la mejor (máx. 1 correo por publicación cada hora).
- Preferencia "Recibir avisos de la comunidad por correo" en el perfil.
- Contador en el menú: respuestas nuevas en mis publicaciones desde mi última visita (guardar `lastSeenCommunityAt` en el perfil).
- Página `/admin/comunidad/reglas` (respeto, nada de spam ni ventas no pedidas, nada de datos personales ajenos,
  sin estafas, apoyo entre creadores de cualquier tamaño, el equipo puede ocultar contenido).

### Paso 7: Pregunta de la semana y lanzamiento
- Cron semanal (ver cómo están los crons en `vercel.json`) que usa la IA para crear una `pregunta` fijada (`pinned`, `fromTeam`)
  según los nichos más activos. Quita el `pinned` de la anterior.
- Sembrar 8–10 publicaciones reales del equipo (las escribe el dueño o Cristal, **no** inventadas como si fueran de otros usuarios).
- Agregar la Comunidad al manual (`/admin/ayuda`), a la página de venta (`app/foliocrew/page.tsx`) y a `docs/foliocrew-contexto-para-gpt.md`.
- Dar el rol **Comunidad** a Cristal en Equipo → Personas (si el dueño lo confirma).

---

## 8. Etapa 2: Conexiones y mensajes

| Tema | Decisión |
|---|---|
| Conexión | `CommunityConnection { requesterId, addresseeId, status: pending/accepted/declined, note }`. Única por par (en cualquier sentido: se valida en el código). |
| Rechazar | Es **silencioso**: quien pidió sigue viendo "Solicitud enviada" (como LinkedIn). Puede cancelarla. |
| Si los dos se piden | Si B ya me pidió y yo le pido a B, se acepta sola. |
| Límites | 20 solicitudes por día. Hay que poder participar (correo confirmado, reglas aceptadas, sin pausa). |
| Bloquear | Borra la conexión, la conversación deja de mostrarse y no se pueden volver a pedir. |
| Mensajes | Solo entre conexiones **aceptadas**. `CommunityConversation` (par ordenado de cuentas, última lectura de cada lado) + `CommunityMessage` (máx. 2000 caracteres). 60 mensajes por hora. Actualización cada 10 s, sin websockets. |
| Privacidad | Los mensajes son privados: el equipo **"entrando como" no los puede leer**. El equipo de Comunidad solo ve un mensaje si alguien lo reporta. |
| Avisos | Correo al recibir solicitud, al ser aceptada y por mensajes nuevos (máx. 1 por conversación cada hora; respeta `emailNotify`). Contadores en el menú. |
| Buscar | Directorio de perfiles con filtros: tipo de creador, nicho, ciudad (texto), idioma, "abierto a colaborar" y nombre. Sin cuentas bloqueadas ni sin reglas aceptadas. |

## 9. Etapa 3 (ideas)
- Círculos con moderadores propios. Reseñas anónimas de marcas (¿paga a tiempo?, rango de pago) unidas a la Inteligencia Foliocrew.
  Mentorías y sesiones en vivo como beneficio del plan Crew.
