# Pagos manuales: PayPal y transferencia (mientras no haya Stripe)

Stripe pide una empresa registrada (LLC u otra). Mientras tanto, Foliocrew cobra **a mano**: cada persona
paga por PayPal o transferencia y tú confirmas el pago desde tu panel. Cuando tengas la empresa, la Fase 10
conecta Stripe y esto pasa a ser automático.

## Cómo funciona

1. **Prueba gratis:** cada cuenta nueva tiene `TRIAL_DAYS` días gratis (14 por defecto).
   Las cuentas que ya existían quedaron como **cortesía**: no pagan ni vencen.
2. **Mi plan** (`/admin/plan`, en el menú Ayuda): la persona ve su estado, los planes (Folio $9 y
   Folio Pro $19 al mes; 12 meses = 10), los datos para pagar y su **referencia** (`FC-SUNOMBRE`).
   - PayPal: el botón abre tu PayPal.me con el monto ya puesto.
   - Transferencia: se muestran los datos de `BANK_TRANSFER_INFO`.
3. **"Ya pagué: avisar":** la persona elige plan, meses y método y pega el ID de la transacción.
   Te llega un correo "Pago reportado".
4. **Tú confirmas** en **Foliocrew → Cuentas → Pagos por confirmar** (o en la ficha de la cuenta),
   cuando veas el dinero en tu PayPal o tu banco:
   - **Confirmar:** el plan queda pagado hasta la nueva fecha (se suma desde hoy o desde el vencimiento
     actual) y le llega el correo "Recibimos tu pago".
   - **No lo encuentro:** le llega un correo pidiendo el comprobante.
   - También puedes **registrar un pago** que te hicieron por otro lado, **hacer una cuenta de cortesía**
     o dar **+7 días de prueba**, desde la ficha de la cuenta.
5. **Recordatorios automáticos** (todos los días a las 14:00 UTC, con Vercel Cron):
   - la prueba termina en 3 días o menos;
   - el plan vence en 5 días o menos;
   - el plan venció (durante los primeros 7 días).
   Cada recordatorio sale una sola vez. En el panel de la persona también aparece un aviso.
6. **Si nadie paga:** los datos y el sitio siguen. En **Cuentas** la ves como **Vencida** y decides si la
   pausas (botón Pausar).

## Variables en Vercel (Production)

| Variable | Ejemplo |
| --- | --- |
| `PAYPAL_URL` | `https://paypal.me/tuusuario` |
| `BANK_TRANSFER_INFO` | `Banco Popular\nTitular: Victor Ruiz\nCuenta de ahorros: 000-000000-0\nCédula: …` |
| `TRIAL_DAYS` | `14` |
| `CRON_SECRET` | una frase larga al azar (Vercel la manda sola al recordatorio diario) |

Después, **Redeploy**.

> **PayPal sin empresa:** con una cuenta personal puedes recibir pagos; para un negocio que cobra seguido,
> PayPal recomienda una **cuenta Business**, que puedes abrir como persona física (sole proprietor), sin LLC.
> Las comisiones de PayPal se descuentan de lo que recibes.

## Cuando tengas la empresa (Fase 10 con Stripe)

Se conecta Stripe para cobro automático con tarjeta, y estos mismos campos (`plan`, `paidUntil`,
`trialEndsAt`) siguen funcionando: los pagos manuales y los de Stripe conviven.
