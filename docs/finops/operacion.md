# Operación — controles de costo (FinOps)

Notas de operación para lo que esta ronda de la auditoría (`docs/finops/auditoria-foliocrew.md`) cambió en código.
Pensado para retomar rápido si se corta el contexto o lo revisa otra persona.

## Qué cambió y cómo revertirlo

Todo es **aditivo y local** (sin migración de base de datos, sin cambio de precios, sin despliegue): 9 archivos
modificados + 3 archivos nuevos (`lib/blob-cleanup.ts`, `tests/ai-quota.test.ts`, `tests/blob-cleanup.test.ts`). Para
revertir cualquiera de las 3 correcciones, `git revert`/`git checkout` del archivo correspondiente es seguro — ninguna
toca datos existentes ni cambia el esquema.

### 1. Cuota de IA atómica (`lib/ai.ts`, `lib/ai-content.ts`, `lib/ai-pitch.ts`, `lib/design-ai.ts`)

- **Qué hace**: antes de llamar a Claude, reserva un cupo dentro de una transacción de Postgres con
  `pg_advisory_xact_lock` por creadora. No depende de Redis ni de ninguna variable nueva.
- **Variables de entorno**: sin cambios — sigue usando `AI_MONTHLY_LIMIT_FOLIO` / `_PRO` / `_CREW` (Vercel) tal como
  antes. Nada que activar.
- **Cómo verificarlo en producción**: pedir 3-4 captions seguidos cerca del tope mensual de una cuenta de prueba
  (bajar el tope temporalmente con `AI_MONTHLY_LIMIT_FOLIO=2` en un preview, por ejemplo) y confirmar que el mensaje
  "Llegaste al límite..." aparece exactamente al tope, no antes ni después.
- **Si algo sale mal**: una reserva que quede "colgada" (la llamada a Claude nunca respondió ni lanzó error, ej. el
  proceso se mató a mitad) deja una fila en `AiUsage` con `inputTokens: 0, outputTokens: 0` — visualmente indistinguible
  de un uso real pero cuenta contra el tope igual que antes (antes esto simplemente no podía pasar porque el conteo se
  hacía después de la respuesta). Si esto preocupa, se puede agregar un job que borre reservas de más de N minutos con
  `inputTokens = 0 AND outputTokens = 0` — no implementado en esta ronda por no ser parte de los 3 hallazgos
  autorizados.
- **`/api/admin/ai/test`**: ahora limitado a 5 pruebas por hora por creadora (`tooManyAttempts`, en memoria — ver nota
  de alcance abajo). No consume el cupo mensual de IA a propósito (ver justificación en la auditoría).

### 2. Limpieza de blobs huérfanos (`lib/blob-cleanup.ts`)

- **Qué hace**: al guardar `content-cards/[id]` (PATCH/DELETE), `hero` (PUT) o el logo de una marca
  (`brands/[id]` PATCH), borra el blob anterior de Vercel Blob si cambió y es de nuestro store.
- **Variables de entorno**: ninguna nueva. Usa `PUBLIC_BLOB_READ_WRITE_TOKEN` (ya existente) de forma indirecta, a
  través del SDK `@vercel/blob`.
- **Alcance NO cubierto todavía** (documentado para la próxima ronda): reseñas, testimonios, enlaces (bio link) y
  banners del Estudio de diseño usan el mismo flujo de subida pero no se les agregó limpieza en esta ronda.
- **Cómo verificarlo**: subir una foto a una tarjeta del feed, reemplazarla por otra, y confirmar en el dashboard de
  Vercel Blob (o `list()` del SDK) que la URL anterior ya no existe. Borrar una tarjeta y confirmar que sus 3 archivos
  (foto/video/miniatura) desaparecen del store.
- **Seguridad del diseño**: nunca borra una URL que no termine en `.vercel-storage.com` (un enlace externo pegado a
  mano no se toca). Cada subida usa `addRandomSuffix: true` (`app/api/admin/upload/route.ts`), así que la misma URL
  exacta no se reutiliza entre dos piezas distintas — el caso "borrar algo que otra fila todavía usa" no debería
  ocurrir en la práctica, pero no hay una verificación cruzada explícita contra todas las tablas (ver limitación en el
  informe de auditoría, hallazgo bajo H-multimedia).
- **Si falla el borrado**: se registra con `console.error` y la operación del usuario (guardar/borrar) ya se completó
  de todas formas — nunca bloquea ni revierte el cambio en la base de datos.

### 3. `AiUsage` agregado a `TENANT_MODELS` (`lib/prisma.ts`)

- Cambio de una línea, sin efecto de comportamiento hoy (todo el código que toca `AiUsage` ya usaba `prismaRoot` con
  filtro manual). Es una red de seguridad para si en el futuro alguien escribe `prisma.aiUsage.algo()` en vez de
  `prismaRoot.aiUsage.algo()` — con el cambio, quedaría automáticamente filtrado por creadora igual que los demás
  modelos.

## Qué sigue sin freno duro (para la próxima ronda, no autorizado todavía)

- **Cuota de almacenamiento por plan** (P1-4): cualquier cuenta puede subir fotos/video sin tope de cantidad ni de
  acumulado. Requiere decidir un número por plan antes de poder implementarlo (producto, no solo código).
- **Rate-limit distribuido** (P1-7): `lib/rate-limit.ts` sigue siendo un `Map` en memoria de proceso. En Vercel con
  varias instancias, el freno de ráfaga (login, IA, comunidad, formularios) es "N por instancia", no "N total". El
  propio equipo ya lo documentó como pendiente para login (`docs/pendientes.md`, propone Upstash Redis) — la cuota
  mensual de IA ya no depende de esto (se corrigió con el advisory lock de Postgres), pero el resto de límites sí.
- **Rutas de Comunidad sin auditar completas** (P1-6): 6 de ~20 rutas verificadas con el patrón correcto; el resto no
  se leyó línea por línea.

## Interruptores existentes (ya en el código, sin cambios en esta ronda)

- `ANTHROPIC_API_KEY` vacía → `isAiConfigured()` devuelve `false` → las funciones de IA devuelven error o caen a un
  fallback por reglas (diseño, pregunta semanal), nunca rompen la página.
- `CRON_SECRET` vacío → los dos crons (`billing`, `insights`) devuelven 401 siempre (fail-closed): no se ejecutan por
  accidente sin el secreto.
- El portafolio público no depende de IA, redes conectadas ni crons: sigue funcionando aunque se apague cualquiera de
  esos interruptores (confirmado por la auditoría: ninguna llamada de IA ni de redes ocurre en el camino de la visita
  pública).
