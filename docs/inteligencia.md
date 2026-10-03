# Centro de mando e Inteligencia Foliocrew

## Centro de mando (`/admin/plataforma`)
Solo para correos en `PLATFORM_ADMIN_EMAILS`. Pestañas:
- **Resumen**: KPIs, pagos por confirmar, altas por semana y lo más destacado.
- **Creadores**: ranking ordenable (seguidores, crecimiento 30 días, engagement mediano, piezas, cobrado).
- **Contenido**: mapa día × franja con el engagement mediano de todas las cuentas, qué red/formato funciona y top 15 publicaciones (filtro por nicho).
- **Nichos**: comparativa por nicho (engagement, vistas, mejor red y formato, tratos).
- **Inteligencia**: lo que aprendió Foliocrew por nicho + botón "Analizar ahora".
- **Cuentas**: la tabla de siempre (pausar, entrar como, notas, planes).

Solo cuentan publicaciones con 100+ vistas. YouTube queda fuera de toda analítica entre cuentas (uso limitado de las APIs de Google).

## Inteligencia Foliocrew
- **Opt-in**: cada cuenta decide sumarse (Reportes o Mi cuenta). Quien entra "como soporte" no puede cambiarlo.
- Cada día (`/api/cron/insights`, 08:00 UTC, requiere `CRON_SECRET`) se calcula por nicho y global: mejores/peores franjas, formato, red, largo de caption, con/sin marca.
- Un grupo solo existe con **3+ cuentas y 10+ publicaciones**; si baja de eso se borra.
- Claude (si `ANTHROPIC_API_KEY` está) escribe un playbook por nicho: qué funciona, qué evitar, ganchos y recomendaciones. Recibe captions sin @usuarios, enlaces ni correos.
- Quien participa ve "Lo que funciona en tu nicho" en Reportes y sus sugerencias de IA usan esos datos.
