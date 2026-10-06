# Plan: Foliocrew en inglés (panel bilingüe)

> **Si eres otra sesión de Claude retomando esto:** lee este archivo y sigue con lo que no esté marcado.
> Reglas del proyecto: `docs/plan-comunidad.md`, sección 2. Responde en español al dueño.

## Por qué
La mayoría de las marcas están en inglés y el video para la revisión de Meta tiene que mostrar la plataforma en inglés.
El sitio público ya era bilingüe; el panel, el registro, los mensajes del servidor y los correos estaban solo en español.

## Cómo funciona (ya hecho)
- `lib/admin-lang.ts`: tipo `AdminLang` (`"es" | "en"`), cookie `admin_lang`, `makeT(lang)`, `plural()`, `dateLocale()`, `pickLabel()`, `validationMessage()`.
- `lib/admin-lang-server.ts`: `getT()` y `getAdminLang()` para páginas de servidor y rutas de API (cookie → idioma del navegador → español).
- `components/admin/AdminLang.tsx`: `AdminLangProvider` (en `app/admin/layout.tsx`) y el hook `useT()` para componentes de cliente.
- `components/admin/LangSwitch.tsx`: selector Español / English (en el menú lateral y en entrar, crear cuenta y recuperar contraseña).
  Guarda la cookie y `AdminUser.language` (`POST /api/admin/language`). Al entrar, si el navegador no eligió, usa el de la cuenta.
- **Cómo traducir un texto:** `t("Texto en español", "English text")`. Fechas: `toLocaleString(dateLocale(lang), …)`.
  Constantes con etiqueta: agrega `labelEn` y usa `pickLabel(lang, item)`.
- **Correos:** usan `AdminUser.language` de quien los recibe (no el idioma de quien hace la acción).
- **Contenido del creador** (su bio, sus textos, sus captions) no se traduce: es suyo. Solo se traduce la interfaz.

## Estado
- [x] Infraestructura (idioma, selector, cookie, columna `AdminUser.language`)
- [x] Menú lateral y layout del panel (avisos del plan)
- [x] Entrar, crear cuenta, recuperar y restablecer contraseña
- [x] Mensajes de error de todas las rutas de API (diccionario + `validationMessage`)
- [x] Pantallas del panel (lista abajo)
- [x] Constantes en `lib/` con etiquetas (estados de tratos, planes, roles, soporte, ideas, redes, nichos…)
- [x] Respuestas de la IA en el idioma del panel (consejos, diseño, inteligencia)
- [x] Correos (plantillas en `lib/email-templates.ts`, `lib/account-emails.ts`, avisos de soporte, ideas y datos)
- [x] Página de venta `app/foliocrew` en inglés
- [x] Prueba completa en inglés (capturas) y en español (que nada se rompió)

### Pantallas y componentes del panel
- [x] `app/admin/(dashboard)/apariencia/DesignStudio.tsx`
- [x] `app/admin/(dashboard)/apariencia/page.tsx`
- [x] `app/admin/(dashboard)/ayuda/page.tsx`
- [x] `app/admin/(dashboard)/bienvenida/Wizard.tsx`
- [x] `app/admin/(dashboard)/bienvenida/page.tsx`
- [x] `app/admin/(dashboard)/bitacora/LogManager.tsx`
- [x] `app/admin/(dashboard)/bitacora/page.tsx`
- [x] `app/admin/(dashboard)/calendario/CalendarView.tsx`
- [x] `app/admin/(dashboard)/calendario/page.tsx`
- [x] `app/admin/(dashboard)/conectar/ConnectManager.tsx`
- [x] `app/admin/(dashboard)/conectar/page.tsx`
- [x] `app/admin/(dashboard)/contacto/SettingsForm.tsx`
- [x] `app/admin/(dashboard)/contacto/page.tsx`
- [x] `app/admin/(dashboard)/crear/Composer.tsx`
- [x] `app/admin/(dashboard)/crear/page.tsx`
- [x] `app/admin/(dashboard)/cuenta/AccountForm.tsx`
- [x] `app/admin/(dashboard)/cuenta/CreatorKindPicker.tsx`
- [x] `app/admin/(dashboard)/cuenta/DataRequestForm.tsx`
- [x] `app/admin/(dashboard)/cuenta/page.tsx`
- [x] `app/admin/(dashboard)/dominio/DomainManager.tsx`
- [x] `app/admin/(dashboard)/dominio/page.tsx`
- [x] `app/admin/(dashboard)/enlaces/LinkEditor.tsx`
- [x] `app/admin/(dashboard)/enlaces/page.tsx`
- [x] `app/admin/(dashboard)/equipo/datos/DataRequestRow.tsx`
- [x] `app/admin/(dashboard)/equipo/datos/page.tsx`
- [x] `app/admin/(dashboard)/equipo/ideas/IdeaRow.tsx`
- [x] `app/admin/(dashboard)/equipo/ideas/page.tsx`
- [x] `app/admin/(dashboard)/equipo/page.tsx`
- [x] `app/admin/(dashboard)/equipo/personas/TeamMembersManager.tsx`
- [x] `app/admin/(dashboard)/equipo/personas/page.tsx`
- [x] `app/admin/(dashboard)/equipo/soporte/[id]/TeamTicketControls.tsx`
- [x] `app/admin/(dashboard)/equipo/soporte/[id]/page.tsx`
- [x] `app/admin/(dashboard)/equipo/soporte/page.tsx`
- [x] `app/admin/(dashboard)/faq/FaqManager.tsx`
- [x] `app/admin/(dashboard)/faq/page.tsx`
- [x] `app/admin/(dashboard)/feed/ContentCardForm.tsx`
- [x] `app/admin/(dashboard)/feed/FeedManager.tsx`
- [x] `app/admin/(dashboard)/feed/page.tsx`
- [x] `app/admin/(dashboard)/hero/HeroForm.tsx`
- [x] `app/admin/(dashboard)/hero/page.tsx`
- [x] `app/admin/(dashboard)/ideas/page.tsx`
- [x] `app/admin/(dashboard)/layout.tsx`
- [x] `app/admin/(dashboard)/lista-de-espera/WaitlistTable.tsx`
- [x] `app/admin/(dashboard)/lista-de-espera/page.tsx`
- [x] `app/admin/(dashboard)/marcas/BrandForm.tsx`
- [x] `app/admin/(dashboard)/marcas/BrandsManager.tsx`
- [x] `app/admin/(dashboard)/marcas/page.tsx`
- [x] `app/admin/(dashboard)/media-kit/StatsManager.tsx`
- [x] `app/admin/(dashboard)/media-kit/page.tsx`
- [x] `app/admin/(dashboard)/mensajes/MessagesManager.tsx`
- [x] `app/admin/(dashboard)/mensajes/page.tsx`
- [x] `app/admin/(dashboard)/metas/GoalsManager.tsx`
- [x] `app/admin/(dashboard)/metas/page.tsx`
- [x] `app/admin/(dashboard)/page.tsx`
- [x] `app/admin/(dashboard)/paquetes/PackagesManager.tsx`
- [x] `app/admin/(dashboard)/paquetes/page.tsx`
- [x] `app/admin/(dashboard)/plan/PayForm.tsx`
- [x] `app/admin/(dashboard)/plan/page.tsx`
- [x] `app/admin/(dashboard)/plataforma/AccountsTable.tsx`
- [x] `app/admin/(dashboard)/plataforma/DepartmentsSection.tsx`
- [x] `app/admin/(dashboard)/plataforma/IntelligenceSection.tsx`
- [x] `app/admin/(dashboard)/plataforma/LeaderboardTable.tsx`
- [x] `app/admin/(dashboard)/plataforma/PendingPayments.tsx`
- [x] `app/admin/(dashboard)/plataforma/RefreshInsightsButton.tsx`
- [x] `app/admin/(dashboard)/plataforma/[id]/AccountActions.tsx`
- [x] `app/admin/(dashboard)/plataforma/[id]/BillingCard.tsx`
- [x] `app/admin/(dashboard)/plataforma/[id]/OwnerEmailForm.tsx`
- [x] `app/admin/(dashboard)/plataforma/[id]/page.tsx`
- [x] `app/admin/(dashboard)/plataforma/charts.tsx`
- [x] `app/admin/(dashboard)/plataforma/page.tsx`
- [x] `app/admin/(dashboard)/reportes/ReportActions.tsx`
- [x] `app/admin/(dashboard)/reportes/mensual/PrintButton.tsx`
- [x] `app/admin/(dashboard)/reportes/mensual/page.tsx`
- [x] `app/admin/(dashboard)/reportes/page.tsx`
- [x] `app/admin/(dashboard)/resenas/ReviewsManager.tsx`
- [x] `app/admin/(dashboard)/resenas/page.tsx`
- [x] `app/admin/(dashboard)/servicios/ServicesManager.tsx`
- [x] `app/admin/(dashboard)/servicios/page.tsx`
- [x] `app/admin/(dashboard)/soporte/NewTicketForm.tsx`
- [x] `app/admin/(dashboard)/soporte/[id]/CustomerTicketActions.tsx`
- [x] `app/admin/(dashboard)/soporte/[id]/page.tsx`
- [x] `app/admin/(dashboard)/soporte/page.tsx`
- [x] `app/admin/(dashboard)/testimonios/TestimonialsManager.tsx`
- [x] `app/admin/(dashboard)/testimonios/page.tsx`
- [x] `app/admin/(dashboard)/vista-publica/PublicPreview.tsx`
- [x] `app/admin/(dashboard)/vista-publica/page.tsx`
- [x] `components/admin/AdminLang.tsx`
- [x] `components/admin/AdminShell.tsx`
- [x] `components/admin/Badge.tsx`
- [x] `components/admin/BilingualTextField.tsx`
- [x] `components/admin/Card.tsx`
- [x] `components/admin/ConfirmDialog.tsx`
- [x] `components/admin/EmailVerifyNotice.tsx`
- [x] `components/admin/EmbedUrlInput.tsx`
- [x] `components/admin/HeroPreview.tsx`
- [x] `components/admin/IdeaForm.tsx`
- [x] `components/admin/ImageCropModal.tsx`
- [x] `components/admin/ImageUploadField.tsx`
- [x] `components/admin/ImpersonationBanner.tsx`
- [x] `components/admin/InsightsCard.tsx`
- [x] `components/admin/LangSwitch.tsx`
- [x] `components/admin/MediaUploadField.tsx`
- [x] `components/admin/PageHeader.tsx`
- [x] `components/admin/ReorderButtons.tsx`
- [x] `components/admin/SetupChecklist.tsx`
- [x] `components/admin/ShareInsightsButton.tsx`
- [x] `components/admin/ToastContext.tsx`
- [x] `components/admin/support/ReplyBox.tsx`
- [x] `components/admin/support/SupportThread.tsx`
