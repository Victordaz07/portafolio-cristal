# Plan maestro de Foliocrew (octubre 2026)

> **Si eres una sesión de Claude retomando este trabajo, empieza aquí.**
> 1. Lee este archivo completo. Para la Comunidad, lee también `docs/plan-comunidad.md` (tiene el detalle técnico).
> 2. Busca en **Estado** el primer paso sin marcar y trabaja solo en ese.
> 3. Cada paso es un PR pequeño. Al terminarlo, marca su casilla **en este archivo** (y en `plan-comunidad.md` si aplica) dentro del mismo PR.
> 4. Responde en **español** y explica en simple: el dueño está aprendiendo a programar con IA ("vibe coding").
> 5. Las **Reglas del proyecto** (seguridad, base de datos, flujo de Git y cómo probar) están en `docs/plan-comunidad.md`, sección 2. Valen para todo este plan.
> 6. Si algo de este plan choca con lo que hay en el código, gana el código: ajusta el plan y dilo en el PR.

De dónde sale este plan: una investigación de mercado (encuestas 2026, reseñas de Linktree, Beacons, Stan, Passionfroot, Deelo y otras;
guías legales; problemas que cuentan los creadores). La versión para leer está en el artifact "Foliocrew: qué construir después".
Resumen de los datos al final, en **Anexo: por qué este orden**.

---

## Estado

**A. Comunidad, etapa 1: muro** (detalle en `docs/plan-comunidad.md`)
- [x] A1. Modelos, migración y rol de equipo `community`
- [x] A2. Perfil de comunidad
- [x] A3. Muro: publicar, listar, filtrar
- [x] A4. Respuestas, "me sirvió", mejor respuesta y reputación
- [x] A5. Reportar, bloquear y Departamento de Comunidad
- [x] A6. Avisos por correo, contador en el menú y reglas
- [x] A7. Pregunta de la semana con IA, sembrado y lanzamiento

**B. Cerrar y cobrar**
- [x] B1. Calculadora "¿Cuánto cobro?"
- [x] B2. Entregables y derechos de uso por trato
- [x] B3. Facturas y recordatorios de cobro
- [x] B4. Contrato simple con aceptación en línea
- [x] B5. Aviso de #publicidad (FTC) al crear contenido patrocinado

**C. Conseguir más tratos**
- [ ] C1. Propuestas a marcas escritas con IA
- [ ] C2. Página "Trabaja conmigo" (solicitar un paquete)
- [ ] C3. Reporte de campaña para la marca
- [ ] C4. Media kit verificado
- [ ] C5. Ingresos e impuestos
- [ ] C6. Comenta una palabra → DM automático (necesita permiso de Meta)

**D. Comunidad, etapa 2: conexiones y mensajes**
- [x] D1. Conexiones
- [x] D2. Mensajes directos
- [x] D3. Buscar colaboradores

**E. Lo que nadie más tiene**
- [ ] E1. Reseñas anónimas de marcas entre creadores
- [ ] E2. Publicación automática desde el calendario
- [ ] E3. Bienestar: banco de contenido y modo descanso
- [ ] E4. Reciclaje de contenido con IA
- [ ] E5. App instalable (PWA) con notificaciones
- [ ] E6. Tienda sin comisión (productos digitales y afiliados)
- [ ] E7. Círculos, mentorías y sesiones en vivo

**G. Programa de Embajadoras** (por invitación; detalle en `docs/plan-embajadores.md`)
- [x] G1. Datos y permisos: interruptor "Embajadora" en la ficha de cuenta (Folio Pro gratis mientras sea embajadora)
- [x] G2. Enlace `?ref=` que funciona como invitación al registro
- [x] G3. Panel de la embajadora, kit para compartir e insignia en su sitio
- [x] G4. Referido que paga → recompensa de meses gratis (cron diario)
- [ ] G5. Mérito automático y sección "Embajadoras" en la página de Foliocrew

**F. Pendientes del dueño (no son código)**: ver la sección F.

---

## Principios (no negociables)

1. **Para todo tipo de creadores**: YouTube, TikTok, Instagram, Facebook, podcast, streaming, UGC, fotografía, escritura… No solo UGC.
   Usa lenguaje neutro ("creadores", "quien crea", "te damos la bienvenida"). Nunca solo femenino.
2. **0% de comisión.** Foliocrew cobra su plan (Folio $9, Pro $19, Crew $49 en `lib/plans.ts`) y nada más.
3. **Foliocrew no mueve dinero de terceros.** Las facturas muestran cómo pagarle al creador (su PayPal, Zelle, transferencia, enlace de pago propio).
   La marca le paga directo al creador. Así evitamos ser procesador de pagos (licencias, riesgos, fraudes).
4. **Nada de cobros sorpresa.** Avisar antes de cobrar el plan, cancelar en un clic, precios claros. (Es la queja #1 contra Beacons y Linktree.)
5. **Hacer pocas cosas muy bien** antes que muchas a medias.
6. **Bilingüe**: lo que ve una marca (factura, contrato, reporte, media kit, "Trabaja conmigo") debe salir en español **e** inglés.
   Usa `lib/i18n.ts` y los campos `…En` como el resto del sitio.
7. **No es asesoría legal ni fiscal.** Contratos e impuestos llevan un aviso claro: "plantilla de referencia; consulta a un profesional".
8. **Las funciones por plan** se deciden con el dueño antes de bloquear algo. Propuesta en cada paso, pero pregunta.

---

## A. Comunidad, etapa 1

Todo el detalle (decisiones, esquema de Prisma, archivos, reglas de cada API y los 7 pasos) está en **`docs/plan-comunidad.md`**.
Va primero porque el dueño lo pidió y porque retiene usuarios.

---

## B. Cerrar y cobrar

El CRM de marcas ya existe: modelo `Brand` (campos `dealStatus`, `dealValue`, `contactName`, `contactEmail`, `paymentStatus`, `nextAction`, …),
`BrandEvent` (historial), `lib/crm.ts`, `lib/brand-crm.ts`, página `app/admin/(dashboard)/marcas`. **Todo lo de B se construye encima de eso.**

### B1. Calculadora "¿Cuánto cobro?"
- **Por qué:** el 53% de las creadoras latinas siente que no le pagan lo justo; nadie sabe cuánto cobrar. Hay apps enteras solo para esto (FYPM, Clara).
- **Qué ve el usuario:** en Marcas (y en el formulario de un trato) un botón "¿Cuánto cobro?". Elige red, formato (reel, post, carrusel, story, video largo, UGC sin publicar),
  cantidad, si incluye **derechos de uso** (30/60/90/365 días), **exclusividad** (días) y **Spark Ads / whitelisting**.
  Ve un rango (bajo, justo, alto) y por qué, y puede "Usar este precio" para llenar `dealValue`.
- **Cómo se calcula** (`lib/rates.ts`, función pura con pruebas en `tests/rates.test.ts`):
  - Base por cada 1,000 seguidores o vistas medianas: Instagram ~$10, TikTok ~$20–25, YouTube video dedicado ~$50–100 (referencias 2026). UGC: precio fijo por pieza ($100–300 de base).
  - Ajuste por interacción: mediana del creador vs. mediana del nicho (`NicheInsight.stats.medianEr`). Más interacción, hasta ×2–3.
  - Derechos de uso: +25–30% por cada 30 días. Whitelisting: +20–50%. Exclusividad: +10–30% según días.
  - Si el nicho tiene datos de tratos reales (`NicheInsight.stats.medianDeal`, `deals` ≥ 5), se muestra "Creadores de tu nicho cobraron en promedio $X".
  - Los datos del creador salen de lo que ya sincroniza Foliocrew (seguidores en `SocialAccount.followers`, métricas en `ContentCard`).
- **Archivos:** `lib/rates.ts`, `components/admin/RateCalculator.tsx`, botón en `marcas/BrandForm.tsx`. Sin cambios en la base de datos.
- **Listo cuando:** el cálculo tiene pruebas, se ve bien en el teléfono y llena el valor del trato.

### B2. Entregables y derechos de uso por trato
- **Por qué:** reemplaza la hoja de cálculo; los derechos de uso vencidos son plata que se pierde.
- **Datos:**
  ```prisma
  model Deliverable {            // entra en TENANT_MODELS
    id          String   @id @default(cuid())
    creatorId   String   @default("")
    creator     Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
    brandId     String
    brand       Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
    title       String              // "Reel de 30 s con el producto"
    network     String?             // instagram | tiktok | youtube | facebook | otro
    format      String?             // reel | post | carousel | story | long_video | ugc
    dueAt       DateTime?
    status      String   @default("todo") // todo | draft | in_review | approved | published
    proofUrl    String?             // enlace a la publicación
    scheduledPostId String?         // si se creó desde el calendario
    order       Int      @default(0)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    @@index([creatorId])
    @@index([brandId])
  }
  ```
  En `Brand` agrega: `usageRightsDays Int?`, `usageRightsStart DateTime?`, `exclusivityDays Int?`, `exclusivityCategory String?`, `whitelisting Boolean @default(false)`.
- **Qué ve el usuario:** dentro de cada trato, una lista de entregables con estado y fecha, y una línea "Derechos de uso: vencen el 12 de diciembre".
  En el Resumen del panel: "3 entregables vencen esta semana" y "Los derechos de Glow Co vencen en 7 días: ¿renovar?".
- **Recordatorios:** en el cron diario (ver `vercel.json` y `app/api/cron/`), correo al creador 2 días antes de cada entrega y 7 días antes de que venzan los derechos.
  Revisa el límite de crons del plan de Vercel antes de agregar uno nuevo; si hace falta, súmalo al cron diario existente.
- **Listo cuando:** se crean, ordenan y marcan entregables; el aviso de vencimiento llega en la prueba local (llama al cron a mano).
- **Cómo quedó:** sin `format` ni `scheduledPostId` por ahora (el título ya dice el formato); se agregaron `remindedAt` en Deliverable y `usageReminderAt` en Brand para no repetir avisos. Los recordatorios corren en el cron diario de cobros (`/api/cron/billing`).

### B3. Facturas y recordatorios de cobro
- **Por qué:** al 87% le han pagado tarde; atrasos de 60–120 días. El 41% dice que es su peor problema.
- **Datos:**
  ```prisma
  model Invoice {                // entra en TENANT_MODELS
    id          String    @id @default(cuid())
    creatorId   String    @default("")
    creator     Creator   @relation(fields: [creatorId], references: [id], onDelete: Cascade)
    brandId     String?
    brand       Brand?    @relation(fields: [brandId], references: [id], onDelete: SetNull)
    number      String              // "FC-2026-0007", consecutivo por cuenta
    publicToken String    @unique   // 32 bytes aleatorios en base64url (crypto), para el enlace de la marca
    kind        String    @default("full") // full | deposit | balance (anticipo / saldo)
    currency    String    @default("USD")
    items       Json                // [{ description, quantity, unitAmount }] en centavos
    subtotal    Int
    notes       String    @default("")
    payTo       String              // cómo pagar: "PayPal: …, Zelle: …" (texto del creador)
    billTo      Json                // { name, company, email, address? }
    language    String    @default("es") // es | en
    issuedAt    DateTime  @default(now())
    dueAt       DateTime
    status      String    @default("draft") // draft | sent | viewed | paid | overdue | void
    sentAt      DateTime?
    viewedAt    DateTime?
    paidAt      DateTime?
    lastReminderAt DateTime?
    remindersSent Int     @default(0)
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
    @@index([creatorId])
    @@index([status, dueAt])
  }
  ```
  En `SiteSettings` (o un modelo `BillingProfile` por cuenta): datos del creador para facturar (nombre legal o artístico, ciudad, país, `payTo` por defecto,
  plazo por defecto en días, cobro de anticipo sí/no). **Nunca** pedir SSN/ITIN ni números de cuenta completos: solo lo que el creador decida mostrar.
- **Qué ve el usuario:**
  - En un trato: "Crear factura" (o "Factura de anticipo 50%" + "Factura de saldo"). Precarga marca, monto y entregables.
  - Lista de facturas con estado (borrador, enviada, vista, pagada, vencida) y total por cobrar.
  - "Enviar" manda un correo a la marca con el enlace público.
- **Página pública para la marca:** `app/f/[token]/page.tsx`, sin sesión, con diseño limpio, bilingüe, y con botón "Descargar PDF".
  Para el PDF basta una versión imprimible: el navegador la guarda con "Guardar como PDF". No hace falta una librería en el servidor.
  Al abrirla, se marca `viewedAt` una vez. Hay un botón "Ya pagamos": avisa al creador y él confirma.
- **Recordatorios automáticos** (cron diario): a la marca el día del vencimiento y a los 7 y 14 días (máximo 3), con tono amable.
  Al creador, avisos cuando la factura se ve, cuando vence y cuando la marca dice que pagó.
  `paymentStatus` del `Brand` se actualiza solo: pasa a `paid` cuando todas sus facturas están pagadas.
- **Seguridad:** el token es aleatorio y largo. La página pública no muestra datos de otros tratos. Límite de intentos en la ruta pública.
- **Listo cuando:** se crea, se envía, la marca la ve (cambia a "vista"), llegan los recordatorios en la prueba y al marcarla pagada cambia el trato.
- **Cómo quedó:** el estado guardado es draft | sent | paid | void; "vista" y "vencida" se calculan (viewedAt y dueAt). Se agregaron `issuer` (tus datos al enviar), `claimedPaidAt` y `overdueNotifiedAt`. Los datos para facturar viven en `BillingProfile`. Los recordatorios corren en `/api/cron/billing`; si la marca ya dijo "Ya pagamos" no se le insiste.

### B4. Contrato simple con aceptación en línea
- **Por qué:** el "ghosting" de marcas después de publicar. Con contrato y anticipo, eso baja mucho.
- **Datos:** `Contract` (en TENANT_MODELS): `brandId`, `publicToken @unique`, `language`, `terms Json` (entregables, fechas, pago, anticipo,
  derechos de uso, exclusividad, whitelisting, revisiones incluidas, cancelación), `bodyText` (texto final generado), `status` (draft|sent|accepted|declined),
  `acceptedName`, `acceptedEmail`, `acceptedAt`, `acceptedIp`, `acceptedUserAgent`.
- **Qué ve el usuario:** "Crear contrato" desde el trato. Elige una plantilla (Publicación patrocinada, UGC sin publicar, Embajador mensual, Afiliado),
  completa los huecos y lo envía. La marca abre `app/c/[token]`, lee y acepta escribiendo su nombre (queda guardada la fecha, la hora y la IP).
  Los dos reciben copia por correo.
- **Aviso fijo:** "Plantilla de referencia. Foliocrew no es un despacho legal; para acuerdos grandes consulta a un abogado."
- **Listo cuando:** se acepta desde la página pública y queda el registro; el trato pasa a "activo".
- **Cómo quedó:** el menú dice "Acuerdos" (`/admin/contratos`). Se agregaron `parties`, `title`, `viewedAt`, `bodyHash` (SHA-256 del texto aceptado), `declinedAt` y `declineReason`: la marca puede "pedir cambios" y el creador reabre el borrador. La cláusula de divulgación (#publicidad / FTC) ya viene en las plantillas con publicación. Un acuerdo aceptado no se cambia ni se borra.

### B5. Aviso de #publicidad (FTC)
- **Por qué:** la FTC exige avisar del patrocinio en los primeros ~125 caracteres, y desde 2026 también avisar si se usó IA.
  La marca y el creador son responsables.
- **Qué hace:** en Crear y en el Calendario, si la publicación está ligada a una marca (`ScheduledPost.brandId`):
  - revisa que el texto empiece con `#ad`, `#publicidad` o `#colaboración`;
  - si no, muestra un aviso con un botón "Agregar #publicidad al inicio";
  - si la IA escribió el texto, recuerda marcar el contenido como hecho con IA en la red.
  Con la herramienta "Contenido de marca" de cada red, la divulgación funciona 17 veces mejor que un hashtag.
- **Archivos:** función pura `lib/disclosure.ts` con pruebas, más el aviso en los formularios. Sin base de datos.
- **Cómo quedó:** `#colaboración`, `#collab` y similares se tratan como **aviso débil** (la guía de la FTC no los considera suficientes); cuentan como claros `#ad`, `#publicidad`, `#patrocinado`, `#anuncio`, `#publi`, `#sponsored` y frases como "colaboración pagada" o "paid partnership". El límite visible es el menor de las redes elegidas (Instagram 125, TikTok y YouTube 100). El recordatorio de IA solo avisa del texto escrito con IA y pide activar la etiqueta "Hecho con IA" de la red si la imagen, el video o la voz también lo están. La IA de captions ahora pone el aviso **al inicio**, no al final. En el Calendario sale un ⚠ en las publicaciones para una marca que no lo tienen.

---

## C. Conseguir más tratos

### C1. Propuestas a marcas con IA
- **Qué ve el usuario:** en Marcas, "Escribir propuesta". Pone la marca (web o Instagram), qué quiere ofrecer y el tono.
  Claude escribe el correo (asunto + cuerpo corto) con el enlace al media kit y 1–2 ideas de contenido para esa marca.
  Botones "Copiar" y "Abrir en mi correo". Además, "Guardar en el CRM": crea el trato como `prospect`, con evento y próxima acción "Seguimiento en 5 días".
- **Seguimientos:** plantillas de seguimiento a los 5 y 12 días (también con IA). El Resumen avisa "Tienes 3 propuestas sin respuesta".
- **Detalles:** usa `lib/ai.ts` (`assertAiQuota`, `recordAiUsage` con un `kind` nuevo `"pitch"`) y `getCreatorContext()`. Al agregar el `kind`, actualiza el comentario del modelo `AiUsage`.
  Las propuestas se envían desde el correo del creador: Foliocrew no manda correos a marcas en nombre del creador sin que él lo haga, para evitar spam y proteger su reputación.

### C2. Página "Trabaja conmigo"
- **Por qué:** el modelo de Passionfroot (la marca elige un paquete y lo solicita), pero sin comisión.
- **Qué ve la marca:** en el sitio del creador, la sección de paquetes muestra precio "desde" y un botón "Solicitar". El formulario pide marca, contacto, fechas, presupuesto y brief.
- **Qué pasa:** se crea el `Brand` como `negotiating` con su `BrandEvent`, y se avisa al creador. Desde ahí, el creador manda contrato (B4) y factura de anticipo (B3).
- **Datos:** agrega a `Package`: `priceFrom Int?`, `currency String @default("USD")`, `requestable Boolean @default(true)`.
  Reutiliza `ContactMessage` o crea `PackageRequest`. Revisa el flujo actual de Contacto antes de decidir.
- **Seguridad:** límite de envíos por IP y un campo oculto anti-bots, como el formulario de contacto actual.

### C3. Reporte de campaña para la marca
- **Qué es:** al marcar un trato como "completado", Foliocrew arma una página pública `app/r/[token]` con:
  - las publicaciones del trato (de los entregables con `proofUrl` y las métricas de `ContentCard`);
  - alcance, vistas, interacción y comparación con su promedio;
  - comentarios destacados y un "¿Repetimos?" que lleva a "Trabaja conmigo".
- **Por qué:** las marcas que repiten pagan más, y casi nadie les manda resultados.
- El creador revisa el reporte antes de enviarlo y puede ocultar métricas que no quiera mostrar.

### C4. Media kit verificado
- **Qué es:** el sello "Datos verificados por Foliocrew · actualizado hace 2 días" junto a las métricas que vienen de una red conectada (no escritas a mano).
  Incluye demografía de la audiencia cuando la API la da (Instagram y YouTube dan edad, género y país con los permisos actuales; revisa qué devuelve cada una)
  y casos de éxito con resultados (sacados de C3).
- **Regla:** si el creador edita un número a mano, ese número pierde el sello.
- **Por qué:** quien tiene un media kit profesional recibe 3.5 veces más propuestas, y las marcas piden números honestos.

### C5. Ingresos e impuestos
- **Qué ve el usuario:** página "Mis ingresos" con:
  - ingresos por mes y por fuente (marcas, desde las facturas pagadas; además afiliados, plataformas y productos, con registro manual);
  - gastos con foto del recibo (Vercel Blob, como las otras subidas);
  - un **apartado sugerido para impuestos** con un % que elige el usuario (por defecto 25%) y el recordatorio de pagos trimestrales en EE. UU. (abril, junio, septiembre, enero);
  - un archivo CSV para el contador.
- **Aviso fijo:** "No es asesoría fiscal."
- **Datos:** `IncomeEntry` y `Expense` (en TENANT_MODELS). Sin datos sensibles: nada de SSN/ITIN ni cuentas.

### C6. Comenta una palabra → DM automático
- **Por qué:** convierte 2–5 veces más que el enlace en bio (lo que hace ManyChat).
- **Requisito externo:** Meta debe aprobar el permiso de mensajes de Instagram (`instagram_business_manage_messages`) con revisión de la app.
  **No envíes la revisión sin que el dueño confirme.** Hasta entonces, solo funciona con cuentas de prueba de la app.
- **Qué hace:** el creador elige una publicación y una palabra ("LINK") y escribe el mensaje. Cuando alguien comenta esa palabra, el webhook de Meta
  avisa a Foliocrew, que responde por DM (respuesta privada) una sola vez por persona. Debe cumplir las reglas de Meta: solo responde a quien comentó.
- **Datos:** `CommentTrigger` y `CommentTriggerHit` (para no repetir). Reutiliza el token de Instagram (`lib/social/accounts.ts`).

---

## D. Comunidad, etapa 2

Ver `docs/plan-comunidad.md`, sección 8. En resumen:
- **D1.** Conexiones: solicitar, aceptar o rechazar.
- **D2.** Mensajes directos solo entre conexiones. Primero con actualización cada 10 s; tiempo real cuando haya volumen.
  La llave de Pusher, Ably o similar la pone el dueño en Vercel **sin mostrarla**.
- **D3.** Buscar colaboradores por tipo de creador, nicho, ciudad, idioma y "abierto a colaborar".

---

## E. Lo que nadie más tiene

- **E1. Reseñas anónimas de marcas:** "¿Paga a tiempo? ¿Cuánto pagó? ¿Cómo fue el trato?". Solo creadores con cuenta verificada.
  Se muestra con un mínimo de 3 reseñas por marca para proteger el anonimato. Se une a la calculadora (B1) y a la Inteligencia por nicho.
  Riesgo legal: reseñas de hechos, sin insultos ni acusaciones. Moderación con el rol `community` y un botón de "derecho de respuesta" para la marca.
- **E2. Publicación automática:** el calendario publica en Instagram (permiso `instagram_business_content_publish`), en Facebook Pages y en YouTube (subida por API).
  TikTok se suma cuando aprueben la app. Cada red puede pedir revisión: **confirmar con el dueño antes de enviarla**.
- **E3. Bienestar:**
  - banco de contenido (ideas y piezas listas para semanas flojas);
  - "modo descanso", que mueve el calendario y avisa a las marcas con entregas cercanas;
  - una alerta si la carga sube mucho (por ejemplo, más de N entregas en 7 días).
  Dato: el 52% de los creadores sufre agotamiento.
- **E4. Reciclaje con IA:** de un video largo o una publicación que funcionó salen versiones para cada red, ganchos y textos.
  Empieza solo con texto (transcripción pegada o subtítulos de YouTube). El video automático va después.
- **E5. App instalable (PWA):** `manifest`, íconos y notificaciones web (Web Push) para "te pagaron", "nuevo comentario", "vence un entregable" y "te respondieron en la comunidad".
- **E6. Tienda sin comisión:** productos digitales (plantillas, presets, guías), asesorías por llamada y enlaces de afiliado en el Link en bio.
  Cobro con el enlace de pago del creador (principio 3). Es el terreno de Stan y Linktree; competir con "0% de comisión".
- **E7. Círculos, mentorías y sesiones en vivo:** grupos con moderadores, sesiones con creadores grandes y beneficio para el plan Crew.

---

## F. Pendientes del dueño (no son código)

Están en `docs/pendientes.md`. Resumen:
- Meta: evaluadores de Instagram, video demo y **revisión de la app** (enviar solo cuando el dueño confirme). Verificación del negocio.
  Un DBA (nombre comercial) en California ayuda, y el dueño ya tiene la guía.
- TikTok: cuando aprueben la app, cambiar las llaves Sandbox por las de Production en Vercel.
- Base de datos de previews en Neon (rama `preview`), cuando entre más gente al equipo.
- Opcionales para crecer: Upstash Redis (límites compartidos), Sentry (errores), actualizar a Next.js 16 en una rama aparte.
- Dar a Cristal los roles del equipo que el dueño decida (hoy: Centro de ayuda + Centro de sugerencias; para la Comunidad, el rol **Comunidad**).

---

## Anexo: por qué este orden

| Dato (2026) | Qué significa para Foliocrew |
|---|---|
| 68% del ingreso de los creadores viene de marcas | Lo más valioso es ayudar a cerrar y cobrar tratos (B, C) |
| 87% ha cobrado tarde; atrasos de hasta 120 días; 41% dice que es su peor problema | Facturas y recordatorios (B3) son lo que hace pagar el plan Pro |
| 53% de las creadoras latinas siente que le pagan injusto; brecha del 29–35% para creadores de color | Calculadora (B1) y reseñas de marcas (E1) |
| Creadores con media kit profesional reciben 3.5× más propuestas | Media kit verificado (C4) |
| 52% ha sufrido agotamiento; 75% siente que el algoritmo castiga si no publica | Bienestar (E3) y comunidad de apoyo (A) |
| Beacons 1.9/5 en Trustpilot por cobros sorpresa; Linktree subió Pro de $9 a $15 y cobra 9–12% por venta; los mercados UGC se quedan hasta con 25% | Principios 2 y 4: sin comisión, sin sorpresas, soporte real |
| "Comenta LINK" convierte 2–5× más que el enlace en bio | C6 |
| 87% de los creadores ya usa IA y ahorra ~3 h por pieza | C1, E4 |
| Creadores con 3+ fuentes de ingreso ganan ~$75K más al año | E6 y C5 |

Fuentes: Campaign, Digiday, Gigapay, Influencer Marketing Factory, Latina Influence Report, We All Grow Latina, Marketing Brew (Clara),
FYPM, Trustpilot/G2 (Beacons), reseñas de Linktree 2026, Contrary Research (Stan), guías FTC 2026, guías de impuestos para creadores 2026.
La lista completa con enlaces está en el artifact de la investigación.
