# Guía: conectar las APIs de redes sociales y la IA

Esta guía explica cómo preparar todo lo necesario para que **Panel → Negocio → Conectar cuentas** funcione:
crear la app de desarrollador en cada red, copiar las claves a Vercel y probar la conexión.

> Los nombres exactos de los menús de Meta, TikTok y Google cambian seguido. Si algo no coincide,
> busca el nombre parecido. Las URLs y las variables de entorno sí son exactas.

---

## 0. Antes de empezar (5 minutos)

### 0.1 Decide la URL fija del sitio

Cada red exige registrar la **URL de redirección exacta** a la que vuelve después del login. Por eso
conviene usar siempre la misma URL:

| Opción | `APP_URL` | Cuándo usarla |
| --- | --- | --- |
| **Producción (recomendada)** | `https://portafolio-cristal.vercel.app` (o tu dominio propio) | Después de unir el PR a `main` |
| Preview de la rama | `https://portafolio-cristal-git-cl-fbf3ce-victor-ruizs-projects-2df6e656.vercel.app` | Para probar antes de unir el PR (esta URL es fija para la rama) |

La pantalla **Conectar cuentas** te muestra la URL de redirección exacta de cada red, con un botón
**Copiar**. Esa URL es la que pegas en cada consola.

> Si usas el preview, revisa en Vercel → Settings → Deployment Protection que el preview no pida
> login de Vercel. Si lo pide, las redes no pueden volver a tu sitio.

### 0.2 Variables generales en Vercel

En Vercel → tu proyecto → **Settings → Environment Variables** agrega:

| Variable | Valor |
| --- | --- |
| `TOKEN_ENCRYPTION_KEY` | Un texto aleatorio largo. Genéralo con `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. **No lo cambies después**: los tokens guardados dejarían de poder leerse y habría que reconectar todo. |
| `APP_URL` | La URL elegida arriba, sin `/` al final. |

Después de agregar o cambiar variables hay que **volver a desplegar** (Deployments → ⋯ → Redeploy).

---

## 1. IA (Claude): lo más rápido de probar

1. Entra a [platform.claude.com](https://platform.claude.com) y crea una cuenta (o usa la tuya).
2. En **Billing** agrega un método de pago o créditos. Sin saldo, la clave no funciona.
3. En **API keys** crea una clave nueva y cópiala (empieza con `sk-ant-`).
4. En Vercel agrega `ANTHROPIC_API_KEY` con esa clave y vuelve a desplegar.
5. En el panel: **Conectar cuentas → IA (Claude) → Probar IA**. Debe aparecer un caption de ejemplo.

**Costo:** el modelo `claude-opus-5-5` cobra $4 por millón de tokens de entrada y $20 por millón de
salida. Un caption usa unos pocos cientos de tokens, así que cuesta **menos de un centavo de dólar**.

---

## 2. Instagram (Instagram API con Instagram Login)

**Requisito:** la cuenta de Instagram debe ser **profesional** (Creator o Business). En la app de
Instagram: Configuración → Tipo de cuenta y herramientas → Cambiar a cuenta profesional. No hace falta
tener una página de Facebook.

1. Entra a [developers.facebook.com/apps](https://developers.facebook.com/apps/) → **Crear app**.
2. Caso de uso: **"Administrar mensajes y contenido en Instagram"**. Tipo de app: **Business**.
3. Dentro de la app, ve a **Instagram → Configuración de la API con inicio de sesión de Instagram**.
4. Copia el **ID de la app de Instagram** y la **clave secreta de la app de Instagram**.
   ⚠️ Son distintos del ID de la app de Meta que aparece arriba de todo.
5. En el paso **"Configurar el inicio de sesión empresarial de Instagram"**, en **URI de redirección de
   OAuth**, pega la URL de redirección de Instagram que muestra el panel y guarda.
6. Mientras la app está en **modo desarrollo**, solo pueden conectarse las cuentas con un rol en la app:
   - **Roles de la app → Roles → Testers de Instagram** → agrega el usuario de Instagram de Cristal.
   - Cristal acepta la invitación en Instagram: Configuración → Apps y sitios web → Invitaciones de
     tester (en la web o en la app).
7. En Vercel agrega `INSTAGRAM_APP_ID` e `INSTAGRAM_APP_SECRET` y vuelve a desplegar.
8. En el panel: **Conectar Instagram** → inicia sesión → acepta los permisos → **Probar**.

**Permisos que pide el panel:** `instagram_business_basic` (perfil y publicaciones),
`instagram_business_manage_comments` (leer y responder comentarios) e
`instagram_business_manage_messages` (DMs, solo dentro de la ventana de 24 h que impone Meta).

**Para que otras creadoras se conecten (versión por suscripción):** la app necesita pasar la
**revisión de Meta** (App Review), con video de demostración y política de privacidad. Para las pruebas
con la cuenta de Cristal no hace falta.

---

## 3. Facebook (páginas)

Usa la **misma app de Meta** del paso anterior.

1. En la app, agrega el producto **Facebook Login for Business**.
2. En **Configuración** de ese producto → **URI de redireccionamiento de OAuth válidos** → pega la URL
   de redirección de Facebook que muestra el panel.
3. (Recomendado) En **Configuraciones** crea una configuración nueva con los permisos
   `pages_show_list` y `pages_read_engagement`. Copia su **ID de configuración**.
4. En **Configuración de la app → Básica** copia el **Identificador de la app** y la **Clave secreta**.
5. En Vercel agrega `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` y, si hiciste el paso 3,
   `FACEBOOK_CONFIG_ID`. Vuelve a desplegar.
6. En el panel: **Conectar Facebook**. En la ventana de Facebook **elige la página de Cristal** cuando
   te pregunte a qué páginas dar acceso.

En modo desarrollo funciona con las personas que tienen un rol en la app (administrador o tester).

---

## 4. TikTok (Login Kit + Display API)

1. Entra a [developers.tiktok.com](https://developers.tiktok.com/) e inicia sesión. Si te lo pide, crea
   una organización o cuenta de desarrollador.
2. **Manage apps → Connect an app** (o "Create app"). Pon nombre, ícono y categoría.
3. Agrega el producto **Login Kit**. En su configuración, en **Redirect URI → Web**, pega la URL de
   redirección de TikTok que muestra el panel. TikTok exige `https` y no acepta `localhost`.
4. En **Scopes** agrega: `user.info.basic`, `user.info.profile`, `user.info.stats` y `video.list`.
5. Usa el modo **Sandbox** para probar sin revisión:
   - Crea un sandbox desde la app.
   - En **Target users** agrega la cuenta de TikTok de Cristal.
6. Copia el **Client key** y el **Client secret** (los del sandbox si estás probando ahí).
7. En Vercel agrega `TIKTOK_CLIENT_KEY` y `TIKTOK_CLIENT_SECRET` y vuelve a desplegar.
8. En el panel: **Conectar TikTok** → **Probar**.

**Qué no se puede con TikTok:** leer o responder DMs, y responder comentarios. TikTok no ofrece eso a
apps de terceros. El token dura 24 h, pero el panel lo renueva solo al probar (el permiso dura 365 días).

---

## 5. YouTube (Google Cloud)

1. Entra a [console.cloud.google.com](https://console.cloud.google.com/) y crea un **proyecto nuevo**.
2. **APIs y servicios → Biblioteca** → busca **YouTube Data API v3** → **Habilitar**.
3. **Google Auth Platform** (antes "Pantalla de consentimiento de OAuth"):
   - Tipo de usuario: **Externo**. Nombre de la app y tu correo.
   - **Público → Usuarios de prueba** → agrega el Gmail de Cristal (el dueño del canal).
   - **Acceso a datos → Agregar permisos** → `.../auth/youtube.readonly`.
4. **Clientes** (o "Credenciales") → **Crear cliente de OAuth** → tipo **Aplicación web**.
   En **URIs de redireccionamiento autorizados** pega la URL de redirección de YouTube que muestra el
   panel.
5. Copia el **ID de cliente** y el **Secreto del cliente**.
6. En Vercel agrega `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` y vuelve a desplegar.
7. En el panel: **Conectar YouTube**. Google mostrará *"Google no verificó esta app"*: es normal en
   modo prueba. Toca **Continuar** y acepta.

**Límite del modo prueba:** mientras la app de Google esté en "Testing", la conexión vence a los
**7 días** y hay que reconectar. Para quitar ese límite hay que publicar la app y pasar la verificación
de Google.

---

## 6. Qué hace el botón "Probar"

1. Si el token está por vencer, lo renueva (Instagram, TikTok, YouTube).
2. Pide a la API el **perfil**: seguidores y datos extra de cada red.
3. Pide las **6 publicaciones más recientes**, con sus métricas.
4. Muestra el resultado o el error exacto que devolvió la red, y lo guarda como "último error".

Los tokens se guardan **cifrados** (AES-256-GCM con `TOKEN_ENCRYPTION_KEY`) y nunca se envían al
navegador ni se muestran en el sitio público.

---

## 7. Errores comunes

| Mensaje | Qué significa | Solución |
| --- | --- | --- |
| `redirect_uri` no coincide / *"URL blocked"* | La URL registrada en la consola no es exactamente la que usa el panel | Copia la URL con el botón **Copiar** del panel y revisa que `APP_URL` sea la misma URL desde la que entras al panel |
| `Invalid platform app` (Instagram) | Se usó el ID de la app de Meta en vez del ID de la app de **Instagram** | Usa el ID y la clave de la sección "API con inicio de sesión de Instagram" |
| `código 190` (Meta) | Token vencido, revocado o inválido | **Volver a conectar** |
| `Insufficient developer role` / no deja entrar | La cuenta no es tester de la app | Agrégala como tester (Meta) o target user (TikTok sandbox) y acepta la invitación |
| `scope_not_authorized` (TikTok) | Falta agregar un permiso a la app | Agrega los 4 scopes del paso 4 |
| `access_denied` (Google) | El Gmail no está en usuarios de prueba | Agrégalo en Google Auth Platform → Público |
| `Esta cuenta de Google no tiene un canal de YouTube` | Iniciaste sesión con otro Gmail | Conecta con el Gmail dueño del canal |
| `La sesión de conexión expiró` | Pasaron más de 10 minutos en la pantalla de login | Vuelve a tocar **Conectar** |
| `Falta TOKEN_ENCRYPTION_KEY` | No está la variable o no se volvió a desplegar | Agrégala y haz **Redeploy** |
