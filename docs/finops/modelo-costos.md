# Modelo de costos — Foliocrew

Calculadora paramétrica (Fase 4 de `docs/finops/auditoria-foliocrew.md`). El modelo vive en
**`scripts/finops/cost-model.mjs`** (ejecutable con `node scripts/finops/cost-model.mjs`, sin
dependencias nuevas); este documento explica las fórmulas, las fuentes de cada precio y cómo
editar los supuestos. No es una factura ni un dashboard: es un punto de partida para decidir
límites y precios, con todo parametrizado para volver a calcular cuando haya datos reales.

## 1. Precios de proveedores (fuente, fecha, moneda = USD)

| Proveedor | Concepto | Precio | Fuente | Fecha | Estado |
|---|---|---|---|---|---|
| Anthropic (Claude) | Sonnet 5.5, input | $2.00 / millón de tokens | [claude.com/pricing](https://claude.com/pricing) | 2026-10-06 | **HECHO VERIFICADO** (página oficial, acceso directo) |
| Anthropic (Claude) | Sonnet 5.5, output | $10.00 / millón de tokens | [claude.com/pricing](https://claude.com/pricing) | 2026-10-06 | **HECHO VERIFICADO** |
| Anthropic (Claude) | Caché de prompt, lectura | $0.20 / millón de tokens | [claude.com/pricing](https://claude.com/pricing) | 2026-10-06 | HECHO VERIFICADO (no se usa hoy en el código) |
| Neon | Compute, plan Launch | $0.106 / CU-hora | búsqueda citando neon.com/pricing | 2026-10-06 | **PRECIO A VERIFICAR** — neon.com bloqueado desde este entorno, confirmar en la página oficial |
| Neon | Storage | $0.35 / GB-mes | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Neon | Egress incluido / excedente | 100 GB/mes incluidos, luego $0.10/GB | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Vercel Blob | Storage (excedente plan Pro) | $0.023 / GB-mes | búsqueda citando vercel.com/docs/storage/vercel-blob | 2026-10-06 | PRECIO A VERIFICAR |
| Vercel Blob | Bandwidth (excedente) | $0.05 / GB | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Vercel Blob | Incluido en Pro | 5 GB storage + 100 GB transferencia | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Vercel (hosting) | Plan Pro | $20/mes por asiento | búsqueda citando vercel.com/pricing | 2026-10-06 | PRECIO A VERIFICAR |
| Vercel (hosting) | Bandwidth incluido / excedente | 1 TB incluido, luego $0.15/GB (US) | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Vercel (hosting) | Invocaciones incluidas / excedente | 1,000,000 incluidas, luego $0.60/millón | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Resend | Plan gratis | 3,000 correos/mes | búsqueda citando resend.com/pricing | 2026-10-06 | PRECIO A VERIFICAR |
| Resend | Plan Pro | $20/mes, 50,000 correos incluidos | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Resend | Excedente | $0.90 / 1,000 correos | ídem | 2026-10-06 | PRECIO A VERIFICAR |
| Pagos | Comisión de procesamiento | $0 (sin pasarela automática) | código (`lib/billing.ts`) | 2026-10-06 | **HECHO VERIFICADO** — pagos manuales por PayPal/transferencia, confirmados por admin |

**Por qué "PRECIO A VERIFICAR" en Neon/Vercel/Resend**: el entorno donde se corrió esta auditoría
bloquea el acceso directo a `neon.com`, `vercel.com` y `resend.com` (proxy de salida de red). Los
números de la tabla vienen de una búsqueda web que cita esas páginas oficiales, pero no se pudo
confirmar con una lectura directa del HTML de la fuente primaria. **Antes de fijar un precio de
venta real o un límite de plan basado en estos números, confírmalos abriendo cada página oficial
desde un navegador normal** (los enlaces están en la tabla) o desde el panel de facturación de cada
proveedor, donde además verás la tarifa real negociada de la cuenta de Foliocrew si difiere de la
tarifa pública.

## 2. Perfiles de uso (SUPUESTO — reemplazar por telemetría real)

Todavía no hay suficientes cuentas en producción para promediar con confianza. `scripts/finops/cost-model.mjs`
define 3 perfiles editables (`ligero`, `normal`, `intensivo`) con supuestos de: llamadas de IA/mes,
tokens de entrada/salida por llamada, GB de fotos/video acumulados, reproducciones de video propio
desde Blob, visitas al sitio público, acciones en el panel y correos enviados.

**Cuando haya datos reales**, reemplaza estos números con promedios de:
- `AiUsage` (ya guarda `inputTokens`/`outputTokens` reales por cuenta y función — ver `lib/ai.ts`).
- Conteo de filas de `ContentCard` por `creatorId` (piezas y tamaño acumulado).
- `FollowerSnapshot`/analítica de visitas si se agrega analytics (hoy no hay un contador de visitas
  persistido — sería necesario agregarlo para tener el dato real).

### Diferenciar reproducción completa de parcial

El modelo cuenta **aperturas del lightbox con video propio** (`monthlyVideoPlaysOwnBlob`) como
"reproducción", no distingue si la persona vio el video completo o lo cerró a los 2 segundos —
Vercel Blob cobra por bytes transferidos, así que una reproducción parcial con *range requests*
(el navegador pide el video en pedazos) ya transfiere menos bytes que el archivo completo de forma
natural; el modelo usa el tamaño completo del archivo como aproximación conservadora (sobreestima
el costo real, no lo subestima).

## 3. Fórmulas

```
costo_IA_por_espacio = llamadas_mes × (tokens_entrada/1e6 × $2.00 + tokens_salida/1e6 × $10.00)

bandwidth_Blob_GB_por_espacio = (reproducciones_video_propio × tamaño_video_MB) / 1024
storage_Blob_GB_por_espacio   = fotos_GB_acumuladas + videos_GB_acumulados

costo_Blob_plataforma = max(0, storage_total_GB − 5) × $0.023
                       + max(0, bandwidth_total_GB − 100) × $0.05

costo_Vercel_plataforma = $20 (asiento)
                         + max(0, invocaciones_total − 1,000,000) × ($0.60/1e6)
                         + max(0, bandwidth_HTML_GB_total − 1024) × $0.15

costo_Resend_plataforma = $0 si correos_total ≤ 3,000, si no $20
                         + max(0, correos_total − incluidos_del_plan) × ($0.90/1000)

costo_Neon_plataforma ≈ horas_compute_activas × $0.106 + storage_filas_GB × $0.35   (aproximado,
                         ver nota de "scale to zero" en el script — es orden de magnitud, no factura)

ingreso = Σ (cuentas_que_pagan_por_plan × precio_del_plan)          [lib/plans.ts: Folio $9, Pro $19, Crew $49]

contribución = ingreso − costo_variable   (IA + Blob + excedente de Resend: escala con uso)
margen_bruto = ingreso − costo_total      (variable + fijo: asiento Vercel, base Resend, Neon)
punto_de_equilibrio = costo_fijo / (contribución / cuentas_que_pagan)
```

**Alcance del margen bruto**: solo costos de infraestructura/proveedores (IA, DB, storage, red,
email, hosting). **No incluye** sueldos, soporte, marketing, impuestos ni comisión de pago (hoy
$0 porque no hay pasarela automática). Es un margen de "costo variable de servir", no un P&L
completo — así se evita prometer una rentabilidad que no contempla el resto del negocio.

## 4. Resultado de los 4 escenarios pedidos

Mezcla de uso supuesta: 65% ligero / 30% normal / 5% intensivo. Mezcla de planes entre quienes
pagan: 50% Folio / 42% Pro / 8% Crew. 55% de los espacios activos son cuentas que pagan (el resto:
prueba gratis, cortesía, embajadoras — editable en `PAYING_SHARE_DEFAULT`).

| Espacios activos | Cuentas que pagan | Costo IA | Costo Blob (storage+bandwidth) | Vercel | Resend | Neon | **Costo total** | Ingreso | Contribución | Margen bruto | Equilibrio (cuentas) |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 55 | $32 | $31 | $20 | $0 | $6 | **$89** | $885 | $822 | $796 | 2 |
| 1,000 | 550 | $324 | $354 | $23 | $20 | $18 | **$739** | $9,020 | $8,342 | $8,281 | 5 |
| 10,000 | 5,500 | $3,240 | $3,585 | $331 | $51 | $83 | **$7,289** | $90,200 | $83,345 | $82,911 | 29 |
| 100,000 | 55,000 | $32,396 | $35,893 | $4,515 | $736 | $130 | **$73,669** | $902,000 | $833,000 | $828,331 | 309 |

Costo por espacio activo: ~$0.74–0.89/mes en todos los escenarios (dominado por IA y bandwidth de
video propio, ambos **variables** — escalan 1:1 con el uso, no son un costo fijo que se diluye).

**Lectura honesta de estos márgenes**: parecen muy altos porque el modelo *solo* cuenta
infraestructura (ver "alcance" arriba) y los supuestos de uso son conservadores. No uses estos
números para prometer rentabilidad a inversionistas o planear contrataciones — son para decidir
**límites de plan** (cuánto cuesta de verdad una cuenta Folio vs. lo que paga) y detectar qué
escala peor (bandwidth de video propio e IA, no la base de datos).

## 5. Cuenta con varios espacios (representante) — PROPUESTA, no construida

**Hallazgo de esta fase**: `lib/plans.ts` anuncia el plan Crew ($49/mes) con la característica
"Hasta 5 perfiles de creador", pero la auditoría de aislamiento multi-tenant (ver
`docs/finops/auditoria-foliocrew.md`, sección DB) confirmó que **no existe ninguna tabla de
pertenencia usuario↔espacio** en el schema: `AdminUser` tiene exactamente un `creatorId` por
cuenta. Es decir, **hoy se anuncia una función que no está construida**. Antes de vender o dejar
activo el plan Crew con esa promesa, hay que decidir: (a) construir la tabla de pertenencia
(siguiendo el patrón ya usado para impersonación: chequeo de rol server-side antes de emitir
acceso), o (b) quitar esa línea del plan hasta construirlo.

Ejemplo de costo (perfil "normal" × 3 espacios, asumiendo que la función ya existiera):

| | Valor |
|---|---|
| Costo variable por espacio | $0.81/mes |
| Costo variable total (3 espacios) | $2.43/mes |
| Contribución si paga 1 plan Crew ($49) | $46.57 |
| Contribución si pagara 3 planes Pro individuales ($57) | $54.57 |

## 6. Sensibilidad

- **30% de las cuentas se vuelven "intensivas" (virales)** sobre el escenario de 1,000 espacios:
  costo total sube de $739 a $2,836 (+284%) — casi todo el incremento es bandwidth de video propio
  servido desde Blob, no IA ni base de datos. Esto confirma el hallazgo P2 de la auditoría: el
  costo de "éxito viral" de una creadora recae en nuestra cuenta de Blob.
- **+50% de llamadas de IA por reintentos sin control** (si algo en el futuro reintentara llamadas
  fallidas sin límite): +$0.25/mes por espacio "normal" — pequeño en este modelo porque hoy *no*
  hay retry automático en el código (confirmado en la auditoría); este número sirve para evaluar el
  costo de agregar uno sin backoff/límite.
- **Archivo pesado**: un solo video de 100MB en vez de los ~15MB supuestos multiplica por ~6.7 el
  costo de bandwidth de esa pieza cada vez que se reproduce — reforzando que el límite de 250MB/video
  actual (`lib/upload-limits.ts`) es generoso comparado con el tamaño típico de un clip UGC vertical.

## 7. Cómo recalcular

```bash
node scripts/finops/cost-model.mjs
```

Edita las constantes `PRICING`, `PROFILES`, `MIX_DEFAULT`, `PLAN_MIX_DEFAULT` y
`PAYING_SHARE_DEFAULT` al inicio del script y vuelve a correrlo. No requiere base de datos ni
variables de entorno — es puro cálculo con los parámetros del archivo.
