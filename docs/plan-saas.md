# Plan: de portafolio de Cristal a Foliocrew (SaaS)

Hoy la app sirve a **una sola creadora**:
- La base de datos tiene una sola portada (`Hero`), una sola configuración (`SiteSettings`)
  y una cuenta por red social (`SocialAccount.platform` es único).
- Hay un solo usuario administrador (`AdminUser`).

Para que cada creadora tenga su Foliocrew, la app tiene que pasar a ser **multiusuario**.
Cada creadora con sus datos, su panel, su sitio y su plan.

La estrategia es **convertir este mismo proyecto**, no empezar de cero. Todo lo construido
(CRM, calendario, IA, reportes, bandeja, conexión con redes) se reutiliza. **Cristal pasa
a ser la creadora número 1**, sin perder nada, y tu portafolio será la número 2.

---

## Cómo va a funcionar

```
foliocrew.app                 → página de venta + registro (lista de espera al principio)
app.foliocrew.app             → panel (cada creadora entra con su correo y ve SOLO lo suyo)
cristal.foliocrew.app         → sitio público de Cristal (gratis con el plan)
tunombre.foliocrew.app        → tu sitio público
www.crisliaugc.com            → dominio propio de la creadora (plan Pro), apunta a su sitio
```

- **Una sola app y una sola base de datos.** Cada tabla tiene un `creatorId`, y todas las
  consultas filtran por la creadora que inició sesión. Una creadora nunca ve datos de otra.
- **El sitio público se elige por la dirección:** el middleware lee el dominio
  (`cristal.foliocrew.app` o `crisliaugc.com`), busca a qué creadora pertenece y muestra su sitio.
- **Dominios propios:** la creadora compra su dominio donde quiera (lo paga ella) y lo escribe
  en su panel. Foliocrew lo registra en Vercel por API, le muestra qué registro DNS poner
  y el certificado HTTPS se genera solo.
- **Redes sociales:** una sola app de Meta, TikTok y Google ("Foliocrew"). Cada creadora
  conecta **su** cuenta, y sus tokens se guardan cifrados y separados.
- **Pagos:** Stripe, con planes, prueba gratis, cobro mensual o anual y portal para cambiar
  la tarjeta o cancelar. Si no paga, su sitio y su panel se pausan (sin borrar nada).

---

## Fases

| Fase | Qué se construye | Resultado |
| --- | --- | --- |
| **7. Multiusuario** ✅ | Tabla `Creator` + `creatorId` en todas las tablas. Migración que pasa los datos actuales a Cristal. Usuarios con registro, inicio de sesión, verificación de correo y recuperar contraseña. Panel que solo muestra lo de cada una. | Cristal y tú, cada una con su panel y sus datos |
| **8. Sitios por creadora** ✅ (se activa al comprar el dominio) | Sitio público por subdominio (`nombre.foliocrew.app`) y dominios propios con verificación de DNS. Media kit, legales y `sitemap` por creadora. | Tu portafolio en vivo, con tu nombre |
| **9. Onboarding** ✅ | Asistente de 4 pasos: nombre del sitio, foto y bio, 3 mejores videos, conectar Instagram. Plantillas de textos por nicho. | Una creadora nueva lista en 10 minutos |
| **10. Pagos (Stripe)** | Planes Folio, Folio Pro y Crew, prueba de 14 días, cupones de fundadora, portal de cliente y webhooks. Funciones según el plan. | Foliocrew cobra solo |
| **11. Página de venta** | `foliocrew.app` con la landing del kit, lista de espera, precios y FAQ. Píxel de Meta para los anuncios. | Adónde mandar el tráfico de Instagram |
| **12. Correos** | Bienvenida, verificación, recuperar contraseña, recordatorios de la prueba y aviso de pago fallido (Resend). | Comunicación automática |
| **13. Tu panel de dueño** | Lista de creadoras, plan, estado de pago, uso de IA, soporte e "entrar como" (para ayudar). | Control del negocio |
| **14. Apps de redes en producción** | Revisión de Meta (App Review + verificación del negocio), auditoría de TikTok y verificación de Google. Te preparo los videos y textos que piden. | Cualquier creadora puede conectar sus redes |

**Orden recomendado:** 7 → 8 → 9, y con eso ya tienes tu portafolio y el de Cristal en
Foliocrew. Después 11 (lista de espera) mientras se hace 10 (pagos), y al final 12, 13 y 14.

---

## Lo que tienes que hacer tú (y lo que cuesta)

| Qué | Por qué | Costo aproximado |
| --- | --- | --- |
| Comprar `foliocrew.app` | La dirección de todo | $9.99 el primer año, $15 al renovar |
| Plan **Vercel Pro** | El plan gratis (Hobby) es solo para uso no comercial; un SaaS que cobra necesita Pro. También permite muchos dominios | $20/mes |
| Base de datos (Neon) | El plan gratis alcanza para empezar | $0, luego ~$19/mes |
| Cuenta de **Stripe** | Cobrar las suscripciones | ~2.9 % + $0.30 por cobro |
| Cuenta de **Resend** (correos) | Correos automáticos | Gratis hasta 3,000/mes |
| **Verificación de negocio en Meta** | Obligatoria para que otras creadoras conecten Instagram | Gratis, pero piden documentos de empresa |
| Empresa (LLC u otra) + cuenta bancaria | Stripe y Meta la piden | Depende del país; consulta con un contador |

> Los precios de los servicios cambian; revísalos al contratar.

---

## Tus dos cuentas

1. **@foliocrew en Instagram:** es la cuenta de la **marca**. Ahí se publican el
   contenido y los anuncios del kit. **No** se conecta a ningún portafolio.
2. **Tu portafolio de creadora en Foliocrew:** en la Fase 7 creas tu usuario y
   conectas **tu** Instagram personal de creadora, igual que lo hará cualquier clienta.
   Así pruebas la plataforma como usuaria real.

> Mientras la app de Meta esté en modo desarrollo, solo pueden conectar Instagram las
> cuentas agregadas como **evaluadoras** en la consola de Meta: agrega la tuya y la de
> Cristal. Para clientas reales hace falta la revisión de Meta (Fase 14).

---

## Riesgos y cómo los cubrimos

- **Que una creadora vea datos de otra:** cada consulta pasa por un filtro central por
  `creatorId`, y hay pruebas automáticas que intentan leer datos ajenos.
- **Romper el sitio de Cristal en la migración:** la migración solo agrega columnas y
  asigna todo a Cristal. Se prueba primero en una copia de la base de datos y su dominio
  actual sigue funcionando.
- **Costos de IA:** cada plan tiene un límite de sugerencias al mes.
- **Que Meta rechace la revisión:** las páginas legales ya existen. Se graban videos claros
  de cada permiso y se pide solo lo que se usa.
