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
- [ ] Pantallas del panel (lista abajo)
- [ ] Constantes en `lib/` con etiquetas (estados de tratos, planes, roles, soporte, ideas, redes, nichos…)
- [ ] Respuestas de la IA en el idioma del panel (consejos, diseño, inteligencia)
- [ ] Correos (plantillas en `lib/email-templates.ts`, `lib/account-emails.ts`, avisos de soporte, ideas y datos)
- [ ] Página de venta `app/foliocrew` en inglés
- [ ] Prueba completa en inglés (capturas) y en español (que nada se rompió)

### Pantallas y componentes del panel
- [ ] `app/admin/(dashboard)/apariencia/DesignStudio.tsx`
- [ ] `app/admin/(dashboard)/apariencia/page.tsx`
- [ ] `app/admin/(dashboard)/ayuda/page.tsx`
- [ ] `app/admin/(dashboard)/bienvenida/Wizard.tsx`
- [ ] `app/admin/(dashboard)/bienvenida/page.tsx`
- [ ] `app/admin/(dashboard)/bitacora/LogManager.tsx`
- [ ] `app/admin/(dashboard)/bitacora/page.tsx`
- [ ] `app/admin/(dashboard)/calendario/CalendarView.tsx`
- [ ] `app/admin/(dashboard)/calendario/page.tsx`
- [ ] `app/admin/(dashboard)/conectar/ConnectManager.tsx`
- [ ] `app/admin/(dashboard)/conectar/page.tsx`
- [ ] `app/admin/(dashboard)/contacto/SettingsForm.tsx`
- [ ] `app/admin/(dashboard)/contacto/page.tsx`
- [ ] `app/admin/(dashboard)/crear/Composer.tsx`
- [ ] `app/admin/(dashboard)/crear/page.tsx`
- [ ] `app/admin/(dashboard)/cuenta/AccountForm.tsx`
- [ ] `app/admin/(dashboard)/cuenta/CreatorKindPicker.tsx`
- [ ] `app/admin/(dashboard)/cuenta/DataRequestForm.tsx`
- [ ] `app/admin/(dashboard)/cuenta/page.tsx`
- [ ] `app/admin/(dashboard)/dominio/DomainManager.tsx`
- [ ] `app/admin/(dashboard)/dominio/page.tsx`
- [ ] `app/admin/(dashboard)/enlaces/LinkEditor.tsx`
- [ ] `app/admin/(dashboard)/enlaces/page.tsx`
- [ ] `app/admin/(dashboard)/equipo/datos/DataRequestRow.tsx`
- [ ] `app/admin/(dashboard)/equipo/datos/page.tsx`
- [ ] `app/admin/(dashboard)/equipo/ideas/IdeaRow.tsx`
- [ ] `app/admin/(dashboard)/equipo/ideas/page.tsx`
- [ ] `app/admin/(dashboard)/equipo/page.tsx`
- [ ] `app/admin/(dashboard)/equipo/personas/TeamMembersManager.tsx`
- [ ] `app/admin/(dashboard)/equipo/personas/page.tsx`
- [ ] `app/admin/(dashboard)/equipo/soporte/[id]/TeamTicketControls.tsx`
- [ ] `app/admin/(dashboard)/equipo/soporte/[id]/page.tsx`
- [ ] `app/admin/(dashboard)/equipo/soporte/page.tsx`
- [ ] `app/admin/(dashboard)/faq/FaqManager.tsx`
- [ ] `app/admin/(dashboard)/faq/page.tsx`
- [ ] `app/admin/(dashboard)/feed/ContentCardForm.tsx`
- [ ] `app/admin/(dashboard)/feed/FeedManager.tsx`
- [ ] `app/admin/(dashboard)/feed/page.tsx`
- [ ] `app/admin/(dashboard)/hero/HeroForm.tsx`
- [ ] `app/admin/(dashboard)/hero/page.tsx`
- [ ] `app/admin/(dashboard)/ideas/page.tsx`
- [x] `app/admin/(dashboard)/layout.tsx`
- [ ] `app/admin/(dashboard)/lista-de-espera/WaitlistTable.tsx`
- [ ] `app/admin/(dashboard)/lista-de-espera/page.tsx`
- [ ] `app/admin/(dashboard)/marcas/BrandForm.tsx`
- [ ] `app/admin/(dashboard)/marcas/BrandsManager.tsx`
- [ ] `app/admin/(dashboard)/marcas/page.tsx`
- [ ] `app/admin/(dashboard)/media-kit/StatsManager.tsx`
- [ ] `app/admin/(dashboard)/media-kit/page.tsx`
- [ ] `app/admin/(dashboard)/mensajes/MessagesManager.tsx`
- [ ] `app/admin/(dashboard)/mensajes/page.tsx`
- [ ] `app/admin/(dashboard)/metas/GoalsManager.tsx`
- [ ] `app/admin/(dashboard)/metas/page.tsx`
- [ ] `app/admin/(dashboard)/page.tsx`
- [ ] `app/admin/(dashboard)/paquetes/PackagesManager.tsx`
- [ ] `app/admin/(dashboard)/paquetes/page.tsx`
- [ ] `app/admin/(dashboard)/plan/PayForm.tsx`
- [ ] `app/admin/(dashboard)/plan/page.tsx`
- [ ] `app/admin/(dashboard)/plataforma/AccountsTable.tsx`
- [ ] `app/admin/(dashboard)/plataforma/DepartmentsSection.tsx`
- [ ] `app/admin/(dashboard)/plataforma/IntelligenceSection.tsx`
- [ ] `app/admin/(dashboard)/plataforma/LeaderboardTable.tsx`
- [ ] `app/admin/(dashboard)/plataforma/PendingPayments.tsx`
- [ ] `app/admin/(dashboard)/plataforma/RefreshInsightsButton.tsx`
- [ ] `app/admin/(dashboard)/plataforma/[id]/AccountActions.tsx`
- [ ] `app/admin/(dashboard)/plataforma/[id]/BillingCard.tsx`
- [ ] `app/admin/(dashboard)/plataforma/[id]/OwnerEmailForm.tsx`
- [ ] `app/admin/(dashboard)/plataforma/[id]/page.tsx`
- [ ] `app/admin/(dashboard)/plataforma/charts.tsx`
- [ ] `app/admin/(dashboard)/plataforma/page.tsx`
- [ ] `app/admin/(dashboard)/reportes/ReportActions.tsx`
- [ ] `app/admin/(dashboard)/reportes/mensual/PrintButton.tsx`
- [ ] `app/admin/(dashboard)/reportes/mensual/page.tsx`
- [ ] `app/admin/(dashboard)/reportes/page.tsx`
- [ ] `app/admin/(dashboard)/resenas/ReviewsManager.tsx`
- [ ] `app/admin/(dashboard)/resenas/page.tsx`
- [ ] `app/admin/(dashboard)/servicios/ServicesManager.tsx`
- [ ] `app/admin/(dashboard)/servicios/page.tsx`
- [ ] `app/admin/(dashboard)/soporte/NewTicketForm.tsx`
- [ ] `app/admin/(dashboard)/soporte/[id]/CustomerTicketActions.tsx`
- [ ] `app/admin/(dashboard)/soporte/[id]/page.tsx`
- [ ] `app/admin/(dashboard)/soporte/page.tsx`
- [ ] `app/admin/(dashboard)/testimonios/TestimonialsManager.tsx`
- [ ] `app/admin/(dashboard)/testimonios/page.tsx`
- [ ] `app/admin/(dashboard)/vista-publica/PublicPreview.tsx`
- [ ] `app/admin/(dashboard)/vista-publica/page.tsx`
- [x] `components/admin/AdminLang.tsx`
- [x] `components/admin/AdminShell.tsx`
- [ ] `components/admin/Badge.tsx`
- [ ] `components/admin/BilingualTextField.tsx`
- [ ] `components/admin/Card.tsx`
- [ ] `components/admin/ConfirmDialog.tsx`
- [ ] `components/admin/EmailVerifyNotice.tsx`
- [ ] `components/admin/EmbedUrlInput.tsx`
- [ ] `components/admin/HeroPreview.tsx`
- [ ] `components/admin/IdeaForm.tsx`
- [ ] `components/admin/ImageCropModal.tsx`
- [ ] `components/admin/ImageUploadField.tsx`
- [ ] `components/admin/ImpersonationBanner.tsx`
- [ ] `components/admin/InsightsCard.tsx`
- [x] `components/admin/LangSwitch.tsx`
- [ ] `components/admin/MediaUploadField.tsx`
- [ ] `components/admin/PageHeader.tsx`
- [ ] `components/admin/ReorderButtons.tsx`
- [ ] `components/admin/SetupChecklist.tsx`
- [ ] `components/admin/ShareInsightsButton.tsx`
- [ ] `components/admin/ToastContext.tsx`
- [ ] `components/admin/support/ReplyBox.tsx`
- [ ] `components/admin/support/SupportThread.tsx`
