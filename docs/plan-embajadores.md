# Plan: Programa de Embajadoras de Foliocrew

> **Si eres otra sesión de Claude retomando este trabajo:** lee este archivo completo y también `docs/plan-maestro.md` (Principios) y `docs/plan-comunidad.md` (sección 2: reglas del proyecto, flujo de Git y cómo probar).
> Responde en **español** y explica en simple: la persona dueña del proyecto está aprendiendo ("vibe coding").
> Cada paso es un PR pequeño. Marca la casilla en este archivo y en `plan-maestro.md` (bloque G) dentro del mismo PR.

---

## 1. Qué es

Un nivel **por invitación, que no se compra**: **Foliocrew Ambassador / Embajadora**. Es para quien habla bien de Foliocrew y tiene audiencia: trae gente y funciona como marketing indirecto de la empresa. Se le premia con un producto único.

Nace de una conversación de ideas con otro asistente (el texto original no se guarda aquí). **Se adaptó al código real**, que es distinto de lo que ese asistente asumió:

| Lo que asumió la idea original | Cómo es este proyecto de verdad | Qué hacemos |
|---|---|---|
| Hay una tabla `User` con el plan | La suscripción vive en **`Creator`** (la cuenta). `AdminUser` solo es quien entra. | Los campos nuevos van en `Creator`; `Referral` apunta a dos `Creator`. |
| Se cobra con Stripe | Los pagos son **manuales** (PayPal o transferencia) y los confirma el equipo: `confirmPayment` en `lib/billing-server.ts`. | "El referido pagó" se detecta **al confirmar el pago**, no con un webhook. |
| "Todo lo de Crew" | **Crew es el plan de agencias** (hasta 5 perfiles de creador, soporte prioritario). | La embajadora recibe **Folio Pro completo + extras**, no los 5 perfiles. |
| El enlace `?ref=` deja entrar a cualquiera | El registro hoy **exige un código de invitación** (`SIGNUP_INVITE_CODE`, `signupMode()` en `lib/creators.ts`). | El enlace de una embajadora **funciona como invitación**. |
| Reutilizar la cuenta de cortesía | `comp` ya existe, pero **no vence ni se puede revocar** y se usa para fundadoras y amistades. | Un interruptor propio (`ambassador`) que se puede quitar. |

## 2. Decisiones ya tomadas (por la persona dueña)

1. **Recompensa:** **meses gratis acumulables**. Nada de porcentaje en dinero: eso obligaría a enviar pagos cada mes, llevar la cuenta de lo que se debe y manejar formularios de impuestos (W-9/1099), y la regla del proyecto es no tocar datos fiscales ni bancarios. Si algún día se quiere, es un proyecto aparte.
2. **Qué incluye:** **todo Folio Pro + extras de embajadora** (insignia, acceso anticipado, línea directa, panel de referidos, destacarla). No incluye los 5 perfiles de Crew.
3. **Cómo se entra:** **solo por invitación** al inicio. El mérito automático (por ejemplo 5 referidos que paguen) se prende más adelante, cuando haya más usuarios.
4. **Registro:** el enlace de cada embajadora **funciona como invitación** (con su código se puede crear la cuenta sin el código de invitación general).

Compatible con los **Principios** del plan maestro: Foliocrew sigue en **0% de comisión** sobre lo que ganan las creadoras, y no mueve dinero de terceros (la recompensa son meses de plan, no dinero).

## 3. Parámetros (se pueden cambiar en un solo archivo, `lib/ambassadors.ts`)

| Parámetro | Valor inicial |
|---|---|
| Meses gratis por cada referido que paga | **1** |
| Espera antes de dar la recompensa | **30 días** después de su primer pago confirmado |
| Mérito automático (más adelante) | **5** referidos pagados |
| Duración de la cookie del enlace | **30 días** |

## 4. Reglas del programa

- **Un referido cuenta una sola vez** y solo si tiene un pago **confirmado** (no cuentan cuentas de cortesía ni pruebas gratis).
- **Antiabuso:** no hay autorreferido (ni con el mismo correo); la recompensa llega **30 días después** del primer pago y solo si la cuenta sigue activa (si no, el referido queda como `churned`); el registro con código tiene límite de intentos.
- **Los meses acumulados extienden `paidUntil`** aunque la embajadora ya sea gratis: si algún día deja de serlo, le queda tiempo pagado.
- **Divulgación:** quien comparte su enlace recibe beneficios, así que debe decir que es embajadora de Foliocrew (#ad / #publicidad). El panel lo explica y el kit de textos ya lo incluye. (Mismo criterio de la cláusula de publicidad de los acuerdos.)
- **Se puede quitar:** el equipo puede quitar el nivel; la cuenta vuelve a su plan normal y los meses acumulados se conservan. Todo queda en el historial del Centro de mando (`logPlatformAction`).
- **Privacidad:** la embajadora ve **cuántos** registró y cuántos pagan, **no** sus nombres ni correos (a menos que cada referido lo autorice más adelante).

## 5. Datos (paso G1)

Campos nuevos en `Creator`:

```prisma
ambassador          Boolean   @default(false)
ambassadorSource    String?            // "invited" | "earned"
ambassadorSince     DateTime?
/// Código del enlace foliocrew.pro/?ref=<código> (se crea al volverse embajadora; no cambia aunque cambie el slug)
referralCode        String?   @unique
/// Mostrar la insignia "Foliocrew Ambassador" en su sitio público
ambassadorBadge     Boolean   @default(true)
referralsAsReferrer Referral[] @relation("referrer")
referral            Referral?  @relation("referred")
```

```prisma
model Referral {
  id          String    @id @default(cuid())
  referrerId  String
  referrer    Creator   @relation("referrer", fields: [referrerId], references: [id], onDelete: Cascade)
  /// Una cuenta solo puede ser referida una vez
  referredId  String    @unique
  referred    Creator   @relation("referred", fields: [referredId], references: [id], onDelete: Cascade)
  /// signed_up | paid | rewarded | churned
  status      String    @default("signed_up")
  paidAt      DateTime?              // primer pago confirmado
  rewardedAt  DateTime?
  rewardMonths Int      @default(0)
  createdAt   DateTime  @default(now())
  @@index([referrerId, status])
}
```

`Creator` no está en `TENANT_MODELS` y `Referral` tampoco (cruza cuentas): se usa `prismaRoot` y los permisos se validan a mano, igual que la Comunidad.

## 6. Pasos (un PR cada uno)

- [x] **G1. Datos y permisos.** Migración (`Creator` + `Referral`). `lib/ambassadors.ts` con los parámetros y la lógica pura (con pruebas). Interruptor **"Embajadora"** en la ficha de cuenta del Centro de mando (con registro en el historial). Efectos: el estado del plan se muestra como "Embajadora" (no vence, no recibe recordatorios de cobro, no entra en "vencidos"), las funciones y los límites de IA son los de Folio Pro, y se le crea su código.
- [x] **G2. Enlace y registro.** `?ref=<código>` guarda una cookie de 30 días (en `middleware.ts`). El registro valida el código: si es de una embajadora activa, **reemplaza al código de invitación** y crea el `Referral` en `signed_up`. Se oculta el campo de código en la pantalla de registro cuando llega con un enlace válido. Sin autorreferido y con límite de intentos.
- [x] **G3. Panel de la embajadora y insignia.** `/admin/embajadora`: su enlace y código (copiar), cuántos registró y cuántos pagan, meses ganados, kit para compartir (textos y recordatorio de divulgación, ES/EN), reglas del programa, y cómo escribir al equipo. Insignia **"Foliocrew Ambassador"** en su sitio público (con opción de ocultarla) que enlaza a `foliocrew.pro/?ref=<código>`.
- [x] **G4. Pagos y recompensas.** En `confirmPayment`: el primer pago confirmado de un referido pasa el `Referral` a `paid`. En el cron diario de cobros: a los 30 días se da la recompensa (`paidUntil` +1 mes), el estado pasa a `rewarded` y se avisa por correo a la embajadora; si la cuenta se pausó o se fue, queda `churned`.
- [x] **G5.** Mérito automático (5 referidos pagados). Sección "Embajadoras" en la página de Foliocrew con quienes lo autoricen. Acceso anticipado a funciones nuevas (bandera por función).

> **Cómo quedó G1:** el interruptor está en *Centro de mando → Cuentas → ficha → Plan y pagos* («Hacer embajadora 💜» / «Quitar nivel Embajadora»; pide confirmación al activar). Al activar se crea el código de 8 letras (`lib/ambassadors-server.ts`, sin 0/O/1/I/L) y se guarda `ambassadorSource = "invited"`; al quitar, **el código se conserva** por si vuelve. El estado del plan pasa a **«Embajadora»** (`billingState` → `ambassador`, no vence): no recibe recordatorios de cobro, no aparece como vencida, en «Mi plan» ya no se le ofrecen planes para pagar, y sus límites de IA son los de Folio Pro (mínimo; si ya era Crew se queda en Crew). `comp` (cortesía) sigue ganando si ambas están. Queda en el historial como `ambassador-on` / `ambassador-off`. Solo lo puede hacer quien administra Foliocrew (403 para cuentas normales). El enlace que se muestra en la ficha todavía **no hace nada** hasta G2.

> **Cómo quedó G2:** `middleware.ts` guarda el código en la cookie `fc_ref` (httpOnly, 30 días) cuando llegas a la portada de Foliocrew (`foliocrew.pro/?ref=…`) o a `/admin/registro?ref=…`; solo si el código tiene el formato correcto (8 letras/números sin confusiones, en mayúsculas o minúsculas). `lib/ambassadors-server.ts` tiene `ambassadorByCode` (solo sirve si la dueña sigue siendo embajadora **y** su cuenta está activa) e `incomingReferral` (primero lo de la dirección, luego la cookie). En `/api/admin/register` un enlace válido **reemplaza** al código de invitación (y abre el registro aunque `SIGNUP_INVITE_CODE` no exista); sin enlace válido todo sigue igual que antes. Al crear la cuenta se anota el `Referral` en `signed_up` y se borra la cookie. En la portada sale un aviso con el botón «Crear mi cuenta» y en el registro desaparece el campo del código. La política de privacidad menciona la cookie. **Antiabuso:** el registro ya tenía límite de 10 intentos por hora y por IP; un correo ya usado no se puede registrar (no hay autorreferido con el mismo correo); un código inventado o retirado da 403. **Todavía no cuenta nada** (no hay pagos ni recompensas): eso es G4.

> **Cómo quedó G3:** `/admin/embajadora` (entrada «Embajadora 💜» en el grupo Ayuda del menú, solo si la cuenta es embajadora; si no lo es, la página lo explica y manda a Soporte). Muestra su enlace y código con botones de copiar, tres cifras (registradas, ya pagan, meses ganados; salen de `referralStats`, solo cantidades), el kit de textos ES/EN (`lib/ambassador-kit.ts`: publicación, historia y mensaje directo; los dos primeros empiezan con `#publicidad`/`#ad` y una prueba lo verifica con `lib/disclosure.ts`), el interruptor de la insignia y las reglas del programa con los parámetros reales. La insignia «💜 Foliocrew Ambassador» sale en el pie del sitio público (`MadeWithFoliocrew` en `app/page.tsx`), enlaza a `foliocrew.pro/?ref=<código>` con `rel="sponsored"`; `currentCreator()` ahora también trae `ambassador`, `ambassadorBadge` y `referralCode`. API: `PATCH /api/admin/ambassador` (`{ badge }`, 403 si no es embajadora). Entrada en el manual (ES/EN). Las reglas ya dicen cómo se ganan los meses, pero **la recompensa todavía no se da** hasta G4.

> **Cómo quedó G4:** `confirmPayment` (que usan tanto «Confirmar» un pago reportado como «Registrar un pago que ya recibiste») llama a `markReferralPaid`: el **primer** pago confirmado de una cuenta referida pasa su `Referral` de `signed_up` a `paid` con `paidAt`. No cuentan los pagos de US$0, ni las cuentas de cortesía o embajadoras, ni un segundo pago (la fecha no cambia). Nunca rompe la confirmación del pago (si falla, solo lo registra en el log). El cron diario `/api/cron/billing` ahora también llama a `grantAmbassadorRewards`: a los `AMBASSADOR.waitDays` (30) días del primer pago decide con `rewardDecision` (función pura, con pruebas): **reward** (la cuenta referida sigue activa y con plan pagado y quien invitó sigue siendo embajadora activa → `paidUntil` + `AMBASSADOR.rewardMonths` mes, `status = rewarded`, correo «Ganaste 1 mes gratis» en el idioma de la embajadora y registro `ambassador-reward` en el historial), **churned** (la referida se pausó o ya no paga → sin recompensa) o **hold** (quien invitó perdió el nivel o está pausada → queda `paid` y se premia si el nivel vuelve). El cambio de estado hace de «cerradura»: dos ejecuciones del cron nunca premian dos veces. Los meses se acumulan sobre el `paidUntil` actual (o desde hoy si ya venció). Todo se puede ajustar en `lib/ambassadors.ts`.

## 7. Pendiente de la persona dueña (no es código)

- Lista de las primeras personas a invitar (buena audiencia y buen contenido).
- Escribir el mensaje de invitación y de bienvenida al programa.
- Confirmar los parámetros de la sección 3 antes de abrirlo a más gente.

## 8. Cómo probar (local)

Dos cuentas de prueba (`vic@` y `cristal@prueba.local`). Activar a una como embajadora desde la ficha del Centro de mando, abrir su enlace `?ref=` en una ventana sin sesión, registrar una cuenta nueva **sin** código de invitación, confirmar un pago a mano y llamar al cron con `Bearer <CRON_SECRET>` moviendo la fecha del primer pago 31 días atrás. Los correos se revisan con `EMAIL_OUTBOX_FILE`. Limpiar los datos de prueba al terminar.

> **Cómo quedó G5:** migración `20261007360000_embajadoras_merito` (`Creator.ambassadorPublic`, apagado por defecto). **Mérito automático:** `AMBASSADOR_MERIT_ENABLED=1` lo prende (por defecto **apagado**: hoy el nivel es solo por invitación). Con eso cualquier cuenta activa tiene su enlace y su código en `/admin/embajadora` («Invita y gana», con barra de avance «X de 5»). Un enlace de una cuenta que aún no es embajadora **nunca abre el registro** (sigue haciendo falta la invitación general o el registro abierto): solo anota el referido (`incomingMeritReferral` en `/api/admin/register`). Cuando 5 referidos han pagado (`paid` o `rewarded`, `AMBASSADOR.meritThreshold`), `promoteByMerit` (se llama al confirmar el primer pago, desde `markReferralPaid`) la sube sola: `ambassador = true`, `ambassadorSource = "merit"`, código conservado, registro `ambassador-merit` en el historial y correo de felicitación; es idempotente (no la promueve ni avisa dos veces). Las recompensas que estaban en espera (`hold`) las entrega el cron diario normal ya como embajadora. **Sección «Embajadoras» en la página de Foliocrew** (`/foliocrew#embajadoras`): solo aparece si al menos una embajadora **eligió** aparecer (interruptor «Aparecer en la página» en su panel); muestra nombre público, foto, nicho y enlace a su sitio (lo mismo que ya es público), nunca correo ni código; si deja de ser embajadora o su cuenta se pausa, desaparece. **Acceso anticipado:** `lib/early-access.ts` (bandera por función: una función en `EARLY_FEATURES` es solo para embajadoras hasta que se quita de la lista o se pone en `EARLY_ACCESS_RELEASED`); hoy la lista está vacía y el panel de la embajadora lo explica; `hasEarlyAccess(id, account)` es lo que debe llamar cada función nueva que se quiera probar primero con ellas. Pruebas en `tests/ambassadors.test.ts`.
