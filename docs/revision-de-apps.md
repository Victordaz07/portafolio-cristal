# Fase 14: revisión de las apps de Meta, TikTok y Google

Mientras las apps de las redes estén en **modo desarrollo**, solo pueden conectar sus cuentas las personas
agregadas como evaluadoras (tú y Cristal). Para que **cualquier persona** que cree contenido conecte
Instagram, TikTok o YouTube, cada red tiene que **revisar y aprobar** la app.

Esta guía tiene todo lo que piden: direcciones, textos en inglés para copiar y pegar, guiones de los
videos y la cuenta de prueba para quien revisa.

> **Orden recomendado:** 1) Instagram (es lo que más usan quienes crean contenido), 2) TikTok, 3) YouTube.
> **Facebook (páginas):** déjalo para después. Pide verificar el negocio y revisar dos permisos más, y
> casi nadie lo usa para colaborar con marcas. Mientras tanto sigue funcionando solo para cuentas evaluadoras.

---

## 0. Antes de empezar (una sola vez)

| Qué | Por qué | Estado |
| --- | --- | --- |
| `foliocrew.pro` en línea con HTTPS | Todas las redes revisan el sitio | ✅ |
| Privacidad, términos y eliminación de datos en el dominio | Obligatorio en las tres | ✅ `https://foliocrew.pro/privacidad`, `/terminos`, `/eliminar-datos` (también en inglés con `?lang=en`) |
| El panel en una sola dirección | Las redes solo aceptan direcciones de regreso registradas | ✅ El panel siempre abre en `https://foliocrew.pro/admin` |
| Íconos | Meta pide 1024×1024 y Google 120×120 | ✅ `public/brand/icono-1024.png` y `icono-120.png` |
| Correo de contacto del negocio | Lo piden las tres | Usa uno tuyo (por ejemplo tu Gmail) hasta tener `hola@foliocrew.pro` |
| **Empresa o negocio verificable** | Meta exige **Business Verification** para el acceso avanzado | ⏳ Tú: documentos del negocio (registro mercantil, LLC, factura de servicios a nombre del negocio, etc.) |
| Cuenta de prueba para quien revisa | Para entrar al panel y probar | ⏳ Ver abajo |

### Cuenta de prueba para quien revisa

1. Abre `https://foliocrew.pro/admin/registro` en una ventana privada.
2. Crea la cuenta:
   - **Nombre:** `App Review`
   - **Dirección:** `revision`
   - **Correo:** `review@foliocrew.pro`. No hace falta que exista ese buzón.
   - **Contraseña:** una nueva, solo para esto (por ejemplo `Foliocrew-Review-2026!`)
   - **Código de invitación:** el tuyo
3. Termina el asistente con datos de ejemplo: foto, nicho y **3 publicaciones de la misma cuenta de Instagram
   que vas a conectar en el video** (así "Sincronizar métricas" las encuentra).
4. Anota el correo y la contraseña: los vas a pegar en cada formulario de revisión. Cuando terminen todas
   las revisiones, cámbiale la contraseña o pausa la cuenta desde **Foliocrew → Cuentas**.

### Variables en Vercel (Production)

Además de las que ya tienes:

- `APP_URL` = `https://foliocrew.pro`: fija la dirección de regreso de las redes.
- Instagram: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`
- TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- YouTube: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `TOKEN_ENCRYPTION_KEY`, que ya debería existir (cifra los tokens).

Revisa los nombres exactos en `.env.example`.

---

## 1. Instagram (Meta): "Instagram API with Instagram Login"

### 1.1 Configuración de la app (developers.facebook.com → tu app)

**App settings → Basic**
- **App domains:** `foliocrew.pro`
- **Privacy Policy URL:** `https://foliocrew.pro/privacidad?lang=en`
- **Terms of Service URL:** `https://foliocrew.pro/terminos?lang=en`
- **User data deletion:** elige **Data deletion callback URL** → `https://foliocrew.pro/api/social/meta/data-deletion`
- **App icon:** `public/brand/icono-1024.png`
- **Category:** Business and pages (o Productivity)
- **Contact email:** tu correo

**Instagram → API setup with Instagram login → Business login settings**
- **OAuth redirect URIs:** `https://foliocrew.pro/api/admin/connect/instagram/callback`
- **Deauthorize callback URL:** `https://foliocrew.pro/api/social/meta/deauthorize`
- **Data deletion request URL:** `https://foliocrew.pro/api/social/meta/data-deletion`

> Las dos direcciones `/api/social/meta/...` ya funcionan. Cuando alguien quita Foliocrew desde Instagram o
> pide borrar sus datos, Foliocrew borra al instante la conexión, los tokens y el historial de seguidores,
> y le da un código para ver el estado en `/eliminar-datos?codigo=…`.

### 1.2 Permisos que vamos a pedir (solo estos dos)

| Permiso | Para qué lo usa Foliocrew |
| --- | --- |
| `instagram_business_basic` | Perfil, seguidores y publicaciones con likes y comentarios: Feed con métricas, Reportes, media kit y metas |
| `instagram_business_manage_comments` | Bandeja: leer, responder, ocultar y borrar comentarios de sus publicaciones |

> Quité `instagram_business_manage_messages` (DMs) de lo que pide la app: todavía no lo usamos, y Meta
> rechaza los permisos que no se ven en el video. Lo agregamos cuando hagamos la bandeja de DMs.

### 1.3 Textos para "App Review → Permissions and features" (copiar y pegar)

**instagram_business_basic: "How will your app use this permission?"**
```
Foliocrew is a portfolio and business-management web app for content creators (including UGC creators).
After a creator logs in to Foliocrew and connects their own Instagram professional account, we use
instagram_business_basic to read the creator's profile (username, profile picture, follower count,
media count) and their recent media with like and comment counts.

This data is shown only to that creator inside their private Foliocrew dashboard:
- "Conectar cuentas" (Connect accounts) → "Probar" (Test): profile, follower count and recent posts
  with likes and comments, so the creator can confirm the right account is connected;
- "Feed / Publicaciones": like and comment counts for the posts the creator features in their public
  portfolio ("Sincronizar métricas" / Sync metrics);
- "Reportes" (Reports): follower growth over time and engagement per post;
- "Media kit": their current follower count, which they can choose to show to brands;
- "Metas" (Goals): progress toward follower goals they set themselves.

We only access the account that the creator connects themselves. We never read other users' data,
never sell data, and the creator can disconnect at any time, which deletes the stored token
immediately.
```

**instagram_business_manage_comments: "How will your app use this permission?"**
```
Foliocrew includes a unified inbox ("Bandeja") where creators manage brand messages and the comments
on their own Instagram posts in one place. We use instagram_business_manage_comments to:
- read the comments on the creator's recent media,
- post a reply to a comment when the creator writes one and clicks "Responder" (Reply),
- hide or unhide a comment, and delete a comment, only when the creator clicks those buttons.

All actions are initiated manually by the creator, on their own posts. Foliocrew never comments,
hides or deletes anything automatically.
```

**"Please provide step-by-step instructions for testing" (Test instructions)**
```
1. Go to https://foliocrew.pro/admin/login
2. Log in with the test account:
   Email: review@foliocrew.pro
   Password: <la contraseña de la cuenta de prueba>
3. In the left menu, open "Negocio → Conectar cuentas" (Connect accounts).
4. On the Instagram card, click "Conectar Instagram" (Connect Instagram) and log in with an Instagram professional
   (Business or Creator) account. Approve the requested permissions.
5. You will return to "Conectar cuentas" with Instagram connected (username and follower count shown).
6. instagram_business_basic: on the Instagram card click "Probar" (Test) to see the profile and the
   recent posts with likes and comments. Then open "Contenido → Feed / Publicaciones" and click
   "↻ Sincronizar métricas" (Sync metrics), and "Negocio → Reportes" → "↻ Actualizar desde redes
   conectadas" to see follower growth.
7. instagram_business_manage_comments: open "Negocio → Bandeja", filter "Instagram". Pick a comment,
   type a reply and click "Responder" (Reply); also try "Ocultar" (Hide) and "Borrar comentario"
   (Delete comment).
8. To disconnect: "Conectar cuentas" → Instagram → "Desconectar". The token is deleted immediately.
The dashboard is in Spanish; the screencast includes English captions for every step.
```

### 1.4 Guion del video (screencast), uno por permiso o uno que cubra los dos

Graba la pantalla en 1080p, con **subtítulos o notas en inglés** en cada paso (el panel está en español).
Duración ideal: 1–3 minutos.

1. **(0:00)** Abre `https://foliocrew.pro`. Subtítulo: *"Foliocrew: portfolio and business dashboard for content creators."*
2. **(0:10)** Entra a `https://foliocrew.pro/admin/login` con la cuenta de prueba. Subtítulo: *"Creator logs in to Foliocrew."*
3. **(0:20)** Menú → **Conectar cuentas** → tarjeta Instagram → **Conectar Instagram**. Subtítulo: *"The creator connects their own Instagram professional account."*
4. **(0:30)** Pantalla de Instagram: inicia sesión y **muestra con calma la lista de permisos** antes de aceptar. Subtítulo: *"Permissions requested: instagram_business_basic, instagram_business_manage_comments."*
5. **(0:45)** De vuelta en Foliocrew: Instagram conectado con usuario y seguidores. Subtítulo: *"Profile and follower count (instagram_business_basic)."*
6. **(0:55)** Tarjeta Instagram → **Probar**: perfil y publicaciones recientes con likes y comentarios. Luego **Feed / Publicaciones** → **↻ Sincronizar métricas**. Subtítulo: *"Recent media with likes and comments (instagram_business_basic)."*
7. **(1:10)** **Reportes** → **↻ Actualizar desde redes conectadas** → crecimiento de seguidores. Subtítulo: *"Follower growth report, visible only to the creator."*
8. **(1:25)** **Bandeja** → filtro Instagram → **Responder** un comentario, **Ocultar** y **Borrar comentario** (usa un comentario de prueba). Subtítulo: *"Reply / hide / delete comments on the creator's own posts (instagram_business_manage_comments)."*
9. **(1:50)** **Conectar cuentas** → Desconectar. Subtítulo: *"Disconnecting deletes the stored token immediately."*

> Prepara antes, en la cuenta de Instagram de prueba, 2 o 3 publicaciones con comentarios (pídele a alguien
> que comente) para que el video muestre datos reales.

### 1.5 Verificación del negocio (Business Verification)

Meta → **Business settings → Security Center → Start verification**. Te pedirán el nombre legal, la
dirección, el teléfono, el sitio web (`foliocrew.pro`) y un documento oficial del negocio. El correo
del dominio ayuda: usa `algo@foliocrew.pro` cuando tengas correos activos (Resend o un buzón).

### 1.6 Enviar
**App Review → Requests → Submit for review.** Suele tardar de 2 a 10 días. Si lo rechazan, Meta dice qué
faltó: pégame el mensaje y lo corregimos.

---

## 2. TikTok: Login Kit + Display API

### 2.1 Configuración (developers.tiktok.com → Manage apps → tu app)

- **App name:** Foliocrew · **Category:** Business / Productivity
- **Description** (máx. 120 caracteres):
  ```
  Portfolio and business dashboard for content creators: showcase your TikTok videos and track your stats.
  ```
- **Icon:** `public/brand/icono-1024.png`
- **Terms of Service URL:** `https://foliocrew.pro/terminos?lang=en`
- **Privacy Policy URL:** `https://foliocrew.pro/privacidad?lang=en`
- **Platforms:** Web → **Website URL:** `https://foliocrew.pro`
- **Login Kit → Redirect URI:** `https://foliocrew.pro/api/admin/connect/tiktok/callback`
- **Verificar el dominio:** TikTok te pide verificar `foliocrew.pro`. Elige **DNS (TXT)**, copia el valor
  `tiktok-developers-site-verification=…` y agrégalo en **Vercel → Domains → foliocrew.pro → DNS Records**
  (tipo TXT, nombre `@`). Luego toca **Verify**.

### 2.2 Productos y scopes

Agrega **Login Kit** y **Display API** (o los nombres equivalentes que muestre el portal) y marca estos scopes:

| Scope | Para qué |
| --- | --- |
| `user.info.basic` | Nombre y foto del perfil |
| `user.info.profile` | Usuario (@) y enlace al perfil |
| `user.info.stats` | Seguidores y total de likes: Reportes, media kit y metas |
| `video.list` | Sus videos con vistas, likes, comentarios y compartidos: Feed y Reportes |

### 2.3 Textos para la solicitud (copiar y pegar)

**"Explain how each product and scope works in your app"**
```
Foliocrew is a portfolio and business dashboard for content creators. A creator logs in to Foliocrew and
connects their own TikTok account with Login Kit.

- user.info.basic and user.info.profile: we show the creator's display name, avatar and username on
  the "Connect accounts" screen so they can confirm which account is connected.
- user.info.stats: we read follower and like counts to build the creator's private follower-growth
  report, keep their media kit numbers up to date and track goals they set themselves.
- video.list: we list the creator's own recent videos with view, like, comment and share counts in
  their private "Feed" and "Reports" sections, so they can feature their best videos in their
  portfolio and see their engagement.

Data is shown only to the creator who connected the account. We never post, never access other
users' data and never sell data. The creator can disconnect at any time, which deletes the stored
tokens immediately.
```

### 2.4 Video demo (lo exige TikTok)

Mismo formato que el de Instagram, con subtítulos en inglés:
1. `https://foliocrew.pro` → login con la cuenta de prueba.
2. **Conectar cuentas** → TikTok → **Conectar TikTok**. Muestra la pantalla de TikTok con los permisos y acepta.
3. De vuelta: usuario, foto y seguidores (`user.info.basic`, `user.info.profile`, `user.info.stats`).
4. Tarjeta TikTok → **Probar**: videos recientes con vistas, likes y comentarios (`video.list`). Luego
   **Feed** → **↻ Sincronizar métricas**.
5. **Reportes** → **↻ Actualizar desde redes conectadas**.
6. **Desconectar**.

> TikTok revisa que el video muestre **el mismo dominio** que pusiste en la app y **cada scope** en uso.
> Suele tardar de 3 a 7 días.

---

## 3. YouTube (Google Cloud): verificación de la pantalla de consentimiento

`youtube.readonly` es un permiso **sensible**: Google pide verificar la app. Mientras no esté verificada,
pueden conectar hasta 100 personas, pero verán el aviso "Google no verificó esta app".

### 3.1 Verificar el dominio (Search Console)
1. https://search.google.com/search-console → **Agregar propiedad → Dominio** → `foliocrew.pro`.
2. Copia el registro TXT `google-site-verification=…` y agrégalo en **Vercel → Domains → foliocrew.pro → DNS
   Records** (TXT, nombre `@`). Luego toca **Verificar**.
   Usa la misma cuenta de Google que tiene el proyecto de Google Cloud.

### 3.2 Pantalla de consentimiento (console.cloud.google.com → APIs y servicios → Pantalla de consentimiento de OAuth / "Google Auth Platform")
- **Tipo de usuario:** Externo
- **Nombre de la app:** Foliocrew · **Correo de asistencia:** tu correo
- **Logo:** `public/brand/icono-120.png`
- **Página principal:** `https://foliocrew.pro`
- **Política de privacidad:** `https://foliocrew.pro/privacidad?lang=en`
- **Condiciones del servicio:** `https://foliocrew.pro/terminos?lang=en`
- **Dominios autorizados:** `foliocrew.pro`
- **Permisos (scopes):** solo `https://www.googleapis.com/auth/youtube.readonly`
- **Credenciales → ID de cliente OAuth (Aplicación web) → URI de redireccionamiento autorizado:**
  `https://foliocrew.pro/api/admin/connect/youtube/callback`

> La política de privacidad ya incluye el párrafo que Google exige: uso de los servicios de la API de YouTube,
> enlaces a los Términos de YouTube y a la Política de privacidad de Google, y el cumplimiento de los
> requisitos de **uso limitado** (Limited Use).

### 3.3 Textos para la verificación (copiar y pegar)

**"How will the scopes be used?" (youtube.readonly)**
```
Foliocrew is a portfolio and business dashboard for content creators. A creator signs in to Foliocrew and
connects their own YouTube channel. We use youtube.readonly to read the creator's channel information
(title, thumbnail, subscriber count) and their own recent videos with view, like and comment counts.

This data is displayed only to that creator inside their private dashboard ("Feed" and "Reports"),
to help them showcase their best videos in their portfolio and track their channel growth.
We do not modify anything on YouTube, we do not access other channels' private data, we do not use
the data for advertising and we do not transfer it to third parties. The creator can disconnect at
any time, which deletes the stored tokens; access can also be revoked at
https://myaccount.google.com/permissions. Our use complies with the Google API Services User Data
Policy, including the Limited Use requirements.
```

### 3.4 Video demo (súbelo a YouTube como "No listado" y pega el enlace)
Google exige que se vea:
1. La página `https://foliocrew.pro` y el login con la cuenta de prueba.
2. **Conectar cuentas → YouTube → Conectar YouTube** y **la pantalla de consentimiento de Google completa**, con el
   nombre "Foliocrew" y la **barra de direcciones visible** (Google revisa que aparezca el `client_id`).
3. De vuelta en Foliocrew: el canal conectado y sus suscriptores.
4. Tarjeta YouTube → **Probar** (videos recientes con sus métricas) y **Reportes**.
5. **Desconectar**.

Subtítulos en inglés en cada paso. La verificación suele tardar de 1 a 4 semanas; Google responde por
correo pidiendo ajustes si hace falta.

---

## 4. Después de la aprobación

- **Meta:** cambia la app a modo **Live** (App Mode → Live).
- **TikTok:** la app pasa a "Live" sola al aprobarse.
- **Google:** **Publicar app** (Estado de publicación → En producción).
- Avísame: quito de la tarjeta de cada red en **Conectar cuentas** el aviso de "solo cuentas de prueba".

## 5. Si algo sale mal

- **"redirect_uri mismatch" o "URL blocked":** la dirección de regreso no coincide. Tiene que ser exactamente
  `https://foliocrew.pro/api/admin/connect/<red>/callback` (sin `/` al final) y `APP_URL` tiene que estar en Vercel.
- **Rechazo por "screencast doesn't show the permission":** vuelve a grabar mostrando el dato o la acción exacta de
  ese permiso, con un subtítulo que nombre el permiso.
- **Rechazo por "privacy policy":** pégame el mensaje; ajusto la página de privacidad.
