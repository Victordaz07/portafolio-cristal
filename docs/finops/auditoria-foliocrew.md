# Auditoría FinOps — Foliocrew

Fecha: 2026-10-06. Alcance: repositorio `portafolio-cristal` tal como está hoy (rama `ccr-2273dedc-44hlka`). Hecha en modo
solo lectura primero (4 agentes de exploración en paralelo + revisión propia), con corrección de 3 hallazgos P1 autorizados
después. Nada de lo de abajo supone Stripe, Supabase ni ningún proveedor que no esté confirmado en código.

Leyenda: **HECHO VERIFICADO** (visto en código/tests), **SUPUESTO** (razonable pero no confirmado), **PROPUESTA** (cambio
sugerido, no aplicado), **PENDIENTE** (a medio construir o fuera del alcance de esta ronda).

## 0. Stack real

| Capa | Proveedor | Evidencia |
|---|---|---|
| Hosting/Crons | Vercel (Next.js 14.2, cron en `vercel.json`) | `vercel.json` |
| Base de datos | Postgres vía Prisma (Neon en producción, según `docs/pendientes.md`) | `.env.example:1-8`, `docs/pendientes.md:7-8` |
| Almacenamiento multimedia | Vercel Blob (store público único) | `app/api/admin/upload/route.ts`, `lib/upload-limits.ts` |
| IA | Anthropic Claude, `claude-sonnet-5-5` por defecto | `lib/ai.ts:7` |
| Correo | Resend | `lib/email.ts` |
| Pagos | Manuales (PayPal.me / transferencia), sin Stripe | `lib/billing.ts`, `lib/billing-server.ts` |
| Redes sociales | OAuth real a Graph API (IG/FB), TikTok API, YouTube Data API v3. Sin webhooks de contenido | `lib/social/providers.ts` |
| OpenAI | Solo en script de build-time (`npm run brand:images`) | `scripts/brand/generate-images.mjs` |

No hay Stripe, no hay suscripciones automáticas, no hay publicación automática en redes ni DMs. "Una cuenta con varios
espacios" (representante) **no existe en código todavía**: solo existe impersonación de soporte, bien controlada por rol
server-side (`app/api/admin/platform/impersonate/route.ts`).

**Hallazgo adicional (detectado al cruzar con el modelo de costos, Fase 4)**: `lib/plans.ts` anuncia el plan Crew
($49/mes) con la característica "Hasta 5 perfiles de creador", pero esa función no está construida (ver arriba). Es una
promesa comercial sin respaldo técnico hoy — ver `docs/finops/modelo-costos.md` sección 5 para el detalle y la decisión
pendiente (construirla o quitar la línea del plan).

## 1. Resultado principal

**No se encontró ningún P0** (gasto descontrolado ilimitado o fuga de datos entre creadoras demostrada). El aislamiento
multi-tenant es sólido (Prisma Client Extension centralizado, `lib/prisma.ts`, que inyecta `creatorId` automáticamente).
Los hallazgos reales son P1/P2: controles ausentes o que no escalan, no brechas abiertas.

## 2. Hallazgos P1 — **3 corregidos en esta ronda**, el resto documentado

| # | Hallazgo | Evidencia | Estado |
|---|---|---|---|
| P1-1 | `/api/admin/ai/test` llamaba a Claude real sin tope ni atribución de costo | `app/api/admin/ai/test/route.ts` | **CORREGIDO** — ver abajo |
| P1-2 | Tope mensual de IA con "contar → comparar → llamar → recién registrar" (no atómico); dos pedidos casi simultáneos podían superar el tope | `lib/ai.ts` | **CORREGIDO** — ver abajo |
| P1-3 | Nunca se llamaba `del()` de Vercel Blob: reemplazar/borrar una foto, video o logo dejaba el archivo anterior huérfano para siempre | `app/api/admin/content-cards/[id]/route.ts`, `hero/route.ts` | **CORREGIDO** — ver abajo |
| P1-4 | Ningún plan tiene cuota de almacenamiento ni límite de cantidad de piezas; `/api/admin/upload` no consulta plan/creadora antes de emitir el token de subida | `lib/plans.ts`, `app/api/admin/upload/route.ts` | **CORREGIDO** — ver abajo |
| P1-5 | `TENANT_MODELS` es una lista blanca manual; un modelo nuevo olvidado queda sin filtrar automáticamente | `lib/prisma.ts` | **PARCIALMENTE CORREGIDO** — se agregó `AiUsage` a la lista (ya estaba protegido a mano en todo el código existente, esto es una red de seguridad adicional sin cambio de comportamiento) |
| P1-6 | Modelos de Comunidad (fuera del extension, por diseño) dependen de checks manuales por ruta; verificado en 6 de ~20 rutas | `app/api/admin/community/**` | PENDIENTE — requiere auditar las ~14 rutas restantes o construir un segundo helper reutilizable |
| P1-7 | El limitador de intentos (`lib/rate-limit.ts`) usado en ~25 endpoints (login, registro, contacto, IA, comunidad…) es un `Map` en memoria de un solo proceso: en Vercel (múltiples instancias) el límite real es "N por instancia" | `lib/rate-limit.ts` | PENDIENTE — ya reconocido en `docs/pendientes.md` para login (propone Upstash Redis); requiere decidir si se contrata Redis compartido |

### Corrección P1-1 y P1-2: cuota de IA atómica

**Antes:** `assertAiQuota()` leía el conteo del mes, comparaba contra el tope, y solo *después* de llamar a Claude se
insertaba la fila de uso (`recordAiUsage`). Dos pedidos casi simultáneos del mismo creador podían leer el mismo conteo,
pasar los dos, y superar el tope.

**Ahora** (`lib/ai.ts`): `reserveAiUsage(kind)` hace todo dentro de una sola transacción de Postgres que toma un
*advisory lock* por creadora (`pg_advisory_xact_lock(hashtext('ai_usage'), hashtext(creatorId))`) antes de contar y
reservar. Una segunda reserva concurrente de la misma creadora espera a que la primera transacción termine y ya ve el
conteo actualizado: el tope queda dureza real incluso con varias instancias de servidor a la vez (el lock vive en la
base de datos compartida, no en memoria de un proceso). Si la llamada a Claude falla, `releaseAiUsage()` quita la
reserva (no se cobra por errores, igual que antes); si tiene éxito, `commitAiUsage()` guarda los tokens reales.

`/api/admin/ai/test` (antes sin ningún freno) ahora usa el mismo `tooManyAttempts` que el resto de endpoints del panel
(5 pruebas por hora por creadora) — deliberadamente **no** se le hizo consumir el cupo mensual de sugerencias, porque es
un diagnóstico de conexión, no una función vendida (decisión de producto documentada aquí para que quede explícita).

**Validado**: `tests/ai-quota.test.ts` dispara 10 reservas concurrentes contra una base Postgres real (local y en CI,
que ya tiene un servicio Postgres — ver `.github/workflows/ci.yml`) con un tope de 3, y confirma que pasan *exactamente*
3 y las otras 7 se rechazan — **PROBADO EN LOCAL** contra Postgres real, no con mocks.

### Corrección P1-3: limpieza de blobs huérfanos

**Antes**: nunca se llamaba `del()` de `@vercel/blob` en todo el repo. Reemplazar una foto/video/logo o borrar una
tarjeta del feed dejaba el archivo anterior en el store para siempre.

**Ahora** (`lib/blob-cleanup.ts`, función `cleanupBlobUrls`): al reemplazar o borrar una pieza en `content-cards/[id]`,
`hero` o el logo de una marca (`brands/[id]`), se borra el blob anterior — **solo si la URL es de nuestro propio store**
(`*.vercel-storage.com`; un enlace externo pegado a mano nunca se toca) y **solo si realmente cambió** (comparando
contra el valor guardado antes del `update`). Es "best effort": si el borrado falla, se registra en consola pero no
interrumpe la respuesta al usuario (su guardado/borrado ya se aplicó en la base de datos).

Límite reconocido de esta corrección (documentado, no resuelto): el mismo patrón de subida (`/api/admin/upload` +
`MediaUploadField`/`ImageUploadField`) también se usa en reseñas, testimonios, enlaces (bio link) y banners del Estudio
de diseño — esos flujos **no** se tocaron en esta ronda (quedan con el mismo problema de huérfanos). Se priorizaron
`content-cards`, `hero` y `brands` por ser los de mayor volumen de reemplazo.

**Validado**: `tests/blob-cleanup.test.ts` prueba que la función que decide "¿es un blob nuestro?" acepta el store real
y rechaza cualquier dominio externo (incluyendo uno que *parece* nuestro dominio pero no lo es) — **PROBADO EN LOCAL**
(función pura, sin red). El `build` completo de Next.js (`npm run build`) también se corrió y terminó sin errores con
estos cambios.

### Corrección P1-4: cuota de piezas propias por plan

**Antes**: ningún plan tenía tope de cantidad ni de almacenamiento; `/api/admin/upload` emitía el
token de subida sin consultar el plan de la cuenta.

**Ahora** (`lib/storage-quota.ts`): se limita la **cantidad de piezas con archivo propio** (foto o
video subido a Blob) por creadora, con el mismo patrón que el tope mensual de IA (`lib/ai.ts`):
default en código, configurable sin tocar código vía `STORAGE_MAX_PIECES_FOLIO` / `_PRO` / `_CREW`
en Vercel. **Un post solo enlazado (TikTok/Instagram/Facebook) nunca cuenta**: no ocupa nuestro
almacenamiento, así que no tiene sentido limitarlo.

Topes por defecto (ver justificación de "real y funcional, sin arriesgar el presupuesto" en
`docs/finops/modelo-costos.md` sección 8):

| Plan | Piezas propias | Peor caso de almacenamiento (todas video de 250MB) | Caso típico (~15MB promedio) |
|---|---:|---:|---:|
| Folio ($9) | 40 | 10 GB | ~0.4-0.6 GB |
| Pro ($19) | 150 | 37.5 GB | ~1.5-2 GB |
| Crew ($49) | 400 | 100 GB | ~4-6 GB |

Se eligió un **límite de cantidad de piezas** (no de bytes exactos) porque el código no guarda hoy
el tamaño real de cada archivo subido (el flujo de subida a Vercel Blob no persiste el `size` del
blob en la base de datos) — agregar seguimiento de bytes exactos por pieza habría significado una
migración más grande (nuevas columnas en varios modelos) para un beneficio marginal, dado que ya
existe un tope de tamaño por archivo (`lib/upload-limits.ts`: 250MB video / 40MB foto). Combinando
ambos topes (cantidad × tamaño máximo) se acota el peor caso de almacenamiento por cuenta sin
necesitar esa migración. Si más adelante se quiere un tope en GB exactos, hay que agregar esa
columna de tamaño primero (documentado aquí para no repetir el análisis).

El tope se verifica en servidor en dos lugares: `POST /api/admin/content-cards` (pieza nueva) y
`PATCH /api/admin/content-cards/[id]` (solo cuando una tarjeta que **no** tenía archivo propio pasa
a tenerlo — reemplazar un archivo que ya existía no suma una pieza nueva). Se muestra en
`/admin/plan` igual que la cuota de IA, en español e inglés, sin lenguaje técnico.

**No es atómico** (a propósito): a diferencia de la cuota de IA, aquí no hay una llamada a un
proveedor externo que cueste dinero en el momento — es una cuenta de filas en nuestra propia base.
El peor caso de una carrera (dos pestañas guardando a la vez cerca del tope) es un puñado de
archivos de más, no un gasto de terceros sin control; no se justificaba la complejidad de un
advisory lock para este caso (si en el futuro se vuelve un problema real, se puede aplicar el mismo
patrón de `reserveAiUsage`).

**Validado**: `tests/storage-quota.test.ts` confirma contra Postgres real que un post solo
enlazado no cuenta, que el tope se respeta exactamente, y que `mediaPieceLimit` responde bien a la
variable de entorno — **PROBADO EN LOCAL**. `npm run build` completo sin errores.

## 3. Hallazgos P2 (relevantes, escalan mal, no corregidos en esta ronda — requieren más alcance/decisión)

- Cron `/api/cron/insights`: recorre todas las creadoras activas en un `for` 100% secuencial, sin paginar la lista,
  dentro de un límite de 300s sin reanudación (`lib/social/metrics-sync.ts:130-143`).
- Sin backoff/retry ante 429/5xx en ninguna llamada a redes sociales (`lib/social/http.ts`).
- Cron `/api/cron/billing` sin `maxDuration` explícito + 2 de 4 tareas sin `take` (`findMany` de todas las creadoras).
- N+1 en 3 crons (billing, deal-reminders, invoice-reminders): se consulta el owner/idioma dentro del loop.
- Store de Blob compartido sin namespacing por creadora: no se puede atribuir costo de almacenamiento/egress a una
  cuenta específica.
- Video propio reproducido vía `<video>` nativo desde Blob (egress nuestro): correcto que el feed solo cargue
  miniaturas, pero un video viral de una creadora costaría banda ancha nuestra, no de un proveedor externo.
- Sin compresión server-side de imágenes; el recorte es client-side y evitable ("omitir recorte" sube el original
  hasta 40MB).
- `Hero`/`SiteSettings`/`ContentCard` se consultan sin `select` explícito en la portada pública, a diferencia de
  `Brand` (que sí tiene un comentario explícito "solo columnas públicas"). No se confirmó un campo sensible expuesto
  hoy, pero el patrón es frágil ante un cambio futuro al schema.
- Sin límite de concurrencia por cuenta en las funciones de IA (nada impide varias llamadas simultáneas del mismo
  creador antes de que se registre el uso — mitigado, no eliminado, por el freno de ráfaga de 30/hora).

## 4. Hallazgos P3 (menores, sin acción en esta ronda)

Comparación del `CRON_SECRET` no es de tiempo constante; validación de tipo de archivo solo por MIME wildcard (no
"magic bytes"); la Bandeja de Instagram hace hasta 9 llamadas reales a Graph API cada vez que se abre/refresca esa
pantalla; desconectar una red borra el token local pero no lo revoca en el proveedor (documentado en el propio
código); `DataDeletionRequest` podría duplicarse si Meta reintenta su callback (sin impacto en datos/saldos); listados
sin paginar en tablas de crecimiento lento (`ContactMessage`, `ContentCard`, `WaitlistEntry`).

## 5. Lo que ya estaba bien (sin cambios)

- 3 captions = 1 sola llamada a Claude (structured outputs con Zod), no 3 llamadas.
- `max_tokens` acotado en toda llamada de IA; degradación elegante a reglas cuando Claude falla o no hay key.
- Ninguna llamada de IA se dispara por visita/refresh de página pública ni al abrir el panel — todas son por clic
  explícito o cron.
- Índices `creatorId` presentes en todo el schema; un único `PrismaClient` singleton; sin `$queryRaw` en el repo.
- Tokens OAuth cifrados con AES-256-GCM; login OAuth bloqueado si falta la clave de cifrado.
- Webhooks de cumplimiento de Meta (deauthorize/data-deletion) con validación HMAC y comparación de tiempo constante.
- Pagos manuales con confirmación por admin: no hay superficie de webhook de pago que asegurar todavía.
- Páginas públicas 100% `force-dynamic`: sin riesgo de que un borrador/preview quede cacheado públicamente.
- `grantAmbassadorRewards` tiene un lock real (`updateMany` + conteo de filas afectadas): previene doble recompensa.

## 6. Clasificación de certeza de este documento

Todo lo marcado como HECHO VERIFICADO fue leído en el código fuente (no solo documentación) por 4 agentes de
exploración independientes más revisión propia, con cita de archivo/línea. Las cifras de precios de proveedores
**no** están en este documento — ver `docs/finops/modelo-costos.md` para esa parte (Fase 4, con fuente y fecha por
cada tarifa, o "PRECIO A VERIFICAR" donde no se pudo confirmar).
