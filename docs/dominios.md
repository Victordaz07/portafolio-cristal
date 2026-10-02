# Dominios en Foliocrew

Cada creadora tiene tres direcciones posibles para su sitio. La que se usa para compartir es la mejor que tenga activa:

| Dirección | Ejemplo | Cuándo funciona |
| --- | --- | --- |
| **Dominio propio** | `https://crisliaugc.com` | Cuando la creadora lo conecta en **Mi dominio** y el DNS queda verificado |
| **Subdominio de Foliocrew** | `https://cristal.foliocrew.app` | Cuando la plataforma tiene su dominio (`PLATFORM_ROOT_DOMAIN`) |
| **Dirección provisional** | `https://portafolio-cristal.vercel.app/s/cristal` | Siempre (no necesita nada) |

El código que decide de quién es cada visita está en `lib/tenant.ts`; las direcciones, en `lib/site-url.ts`.

## 1. Activar los subdominios (`nombre.foliocrew.app`)

Una sola vez, cuando compres el dominio de la plataforma:

1. Compra `foliocrew.app`. En Vercel queda conectado solo a la cuenta.
2. En el proyecto, ve a **Settings → Domains** y agrega:
   - `foliocrew.app`: la portada de Foliocrew;
   - `www.foliocrew.app`: con redirección a `foliocrew.app`;
   - `*.foliocrew.app`: el comodín para los sitios de todas las creadoras.

   El comodín exige que el dominio use los **nameservers de Vercel** (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). Si lo compraste en Vercel, ya los usa.
3. En **Settings → Environment Variables (Production)** agrega `PLATFORM_ROOT_DOMAIN=foliocrew.app`.
4. Vuelve a publicar (**Redeploy**).

Desde ese momento:
- `foliocrew.app` muestra la portada de Foliocrew, con los botones "Crear mi cuenta" y "Entrar";
- `nombre.foliocrew.app` muestra el sitio de cada creadora;
- el panel funciona en `foliocrew.app/admin` (o `app.foliocrew.app/admin`);
- `portafolio-cristal.vercel.app` sigue mostrando a Cristal.

## 2. Dominios propios de las creadoras (automático)

En **Mi dominio**, la creadora escribe su dominio y el panel le muestra el registro DNS exacto:

| Su dominio | Registro | Nombre | Valor |
| --- | --- | --- | --- |
| Raíz (`crislia.com`, `crislia.com.do`) | A | `@` | `76.76.21.21` |
| Subdominio (`www.crislia.com`, `portafolio.crislia.com`) | CNAME | `www` / `portafolio` | `cname.vercel-dns.com` |

Para que Foliocrew **agregue el dominio a Vercel y lo verifique solo**, configura en Vercel (Production):

| Variable | Valor |
| --- | --- |
| `VERCEL_API_TOKEN` | Un token de **vercel.com/account/tokens**, con acceso al equipo del proyecto |
| `VERCEL_PROJECT_ID` | `prj_0eLobLmHfmUISNF5L1s0A35Laazv` |
| `VERCEL_TEAM_ID` | `team_sLNo1ShZ17Eb3f09oaiQ91Zc` |

Con eso:
1. Al conectar, el dominio se agrega al proyecto.
2. "Comprobar ahora" consulta a Vercel: si el DNS ya apunta, el dominio queda **Conectado ✓** y HTTPS se activa solo.
3. Si ese dominio se usó antes en otra cuenta de Vercel, el panel muestra el registro TXT que pide Vercel para confirmar que es suyo.

**Sin el token (modo manual):** el panel igual muestra el registro DNS y comprueba si ya apunta a Vercel, pero tú tienes que agregar el dominio a mano en **Settings → Domains**.

## Reglas
- Un dominio solo puede estar en una cuenta; `crislia.com` y `www.crislia.com` cuentan como el mismo.
- No se pueden usar `*.foliocrew.app`, `*.vercel.app` ni `localhost` como dominio propio.
- Quitar el dominio en el panel lo quita también de Vercel. El dominio sigue siendo de la creadora.
- Los cambios de DNS pueden tardar desde minutos hasta 48 h.
