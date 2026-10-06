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

- [ ] **G1. Datos y permisos.** Migración (`Creator` + `Referral`). `lib/ambassadors.ts` con los parámetros y la lógica pura (con pruebas). Interruptor **"Embajadora"** en la ficha de cuenta del Centro de mando (con registro en el historial). Efectos: el estado del plan se muestra como "Embajadora" (no vence, no recibe recordatorios de cobro, no entra en "vencidos"), las funciones y los límites de IA son los de Folio Pro, y se le crea su código.
- [ ] **G2. Enlace y registro.** `?ref=<código>` guarda una cookie de 30 días (en `middleware.ts`). El registro valida el código: si es de una embajadora activa, **reemplaza al código de invitación** y crea el `Referral` en `signed_up`. Se oculta el campo de código en la pantalla de registro cuando llega con un enlace válido. Sin autorreferido y con límite de intentos.
- [ ] **G3. Panel de la embajadora y insignia.** `/admin/embajadora`: su enlace y código (copiar), cuántos registró y cuántos pagan, meses ganados, kit para compartir (textos y recordatorio de divulgación, ES/EN), reglas del programa, y cómo escribir al equipo. Insignia **"Foliocrew Ambassador"** en su sitio público (con opción de ocultarla) que enlaza a `foliocrew.pro/?ref=<código>`.
- [ ] **G4. Pagos y recompensas.** En `confirmPayment`: el primer pago confirmado de un referido pasa el `Referral` a `paid`. En el cron diario de cobros: a los 30 días se da la recompensa (`paidUntil` +1 mes), el estado pasa a `rewarded` y se avisa por correo a la embajadora; si la cuenta se pausó o se fue, queda `churned`.
- [ ] **G5. Más adelante.** Mérito automático (5 referidos pagados). Sección "Embajadoras" en la página de Foliocrew con quienes lo autoricen. Acceso anticipado a funciones nuevas (bandera por función).

## 7. Pendiente de la persona dueña (no es código)

- Lista de las primeras personas a invitar (buena audiencia y buen contenido).
- Escribir el mensaje de invitación y de bienvenida al programa.
- Confirmar los parámetros de la sección 3 antes de abrirlo a más gente.

## 8. Cómo probar (local)

Dos cuentas de prueba (`vic@` y `cristal@prueba.local`). Activar a una como embajadora desde la ficha del Centro de mando, abrir su enlace `?ref=` en una ventana sin sesión, registrar una cuenta nueva **sin** código de invitación, confirmar un pago a mano y llamar al cron con `Bearer <CRON_SECRET>` moviendo la fecha del primer pago 31 días atrás. Los correos se revisan con `EMAIL_OUTBOX_FILE`. Limpiar los datos de prueba al terminar.
