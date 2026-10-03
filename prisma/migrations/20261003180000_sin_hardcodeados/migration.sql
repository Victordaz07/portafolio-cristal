-- AlterTable
-- IF NOT EXISTS: "contactPhotoUrl" ya pudo crearse desde otra rama (migración 20261003140000_contact_photo),
-- porque las vistas previas usan la misma base de datos.
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "brandsBannerUrl" TEXT,
ADD COLUMN IF NOT EXISTS "contactPhotoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT NOT NULL DEFAULT 'acento';

-- El sitio de Cristal (la creadora original) conserva su aspecto: oliva, su foto de contacto y su banner de marcas.
-- Las demás cuentas pasan al color del acento y dejan de mostrar las fotos de Cristal.
UPDATE "SiteSettings" SET "secondaryColor" = 'oliva',
  "contactPhotoUrl" = '/images/contact-photo.webp',
  "brandsBannerUrl" = '/images/brands-banner.png'
WHERE "creatorId" IN (SELECT "id" FROM "Creator" WHERE "slug" = 'cristal');
