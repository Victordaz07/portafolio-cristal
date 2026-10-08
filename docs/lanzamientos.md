# Lanzamiento por temporadas

> **Si eres otra sesión de Claude:** responde en español y explica en simple. Las reglas del proyecto están en `docs/plan-comunidad.md` (sección 2).

## Qué es

En **Centro de mando → Lanzamientos** el dueño decide quién ve cada módulo del panel, uno por uno o por temporada completa:

| Posición | Quién lo ve | Cómo se ve en el menú |
|---|---|---|
| **Apagado** | Nadie (salvo quien administra Foliocrew) | No sale; la página da 404. Los datos de cada cuenta se guardan. |
| **Embajadores** | Cuentas con el nivel Embajadora | Etiqueta «Anticipado». También sale en su panel de embajadora. |
| **Todos** | Toda cuenta activa | Etiqueta «Nuevo» durante `NEW_BADGE_DAYS` (14) días si antes no estaba para todos. |

Quien administra Foliocrew ve todo, con la etiqueta de su posición, para revisarlo. Con «Entrar como» se ve exactamente lo que ve esa cuenta.
Cada cambio queda en el historial (`PlatformAction`, acción `release`) y en «Últimos cambios» de la misma pestaña.

## Dónde está el código

- `lib/releases.ts`: catálogo de módulos y temporadas (nombre, descripción, posición inicial, páginas del panel) y las reglas puras. Pruebas en `tests/releases.test.ts`.
- `lib/releases-server.ts`: lectura (`getReleases`, una consulta por petición), `requireModule(id)` para páginas, `moduleBlockedResponse(id)` para APIs, `navAccess` para el menú y `setReleaseLevels` para guardar.
- Tabla `FeatureRelease` (global, no va en `TENANT_MODELS`). Un módulo sin fila usa su posición inicial. Si la tabla no existe (por ejemplo, un preview que no migra), se usan las posiciones iniciales.
- Bloqueo de páginas: un `layout.tsx` pequeño en la carpeta de cada módulo (`app/admin/(dashboard)/<módulo>/layout.tsx`).
- Menú: `app/admin/(dashboard)/layout.tsx` calcula `navAccess` y `components/admin/AdminShell.tsx` esconde y etiqueta.
- Funciones de un módulo dentro de otra página: Propuestas con IA y Reportes a marcas dentro de Marcas, la opción de publicación automática en Crear, y los avisos de Bienestar, Propuestas y Metas en el Resumen.
- APIs bloqueadas: las de IA de Propuestas y Reciclar, y la publicación automática. Las demás APIs no se bloquean (sin la página no hay forma normal de usarlas).

## Agregar un módulo nuevo

1. Agrégalo a `RELEASE_MODULES` con su temporada, su posición inicial (normalmente `off`) y sus páginas en `hrefs`.
2. Crea `layout.tsx` en su carpeta con `await requireModule("<id>")`.
3. Si tiene APIs que cuestan dinero (IA), usa `moduleBlockedResponse("<id>")`.

El sitio público de cada creadora no cambia con esto: solo el panel.
