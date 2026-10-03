-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "brandsBannerUrl" TEXT,
ADD COLUMN     "contactPhotoUrl" TEXT,
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT 'acento';

-- El sitio de Cristal (la creadora original) conserva su aspecto: oliva, su foto de contacto y su banner de marcas.
-- Las demás cuentas pasan al color del acento y dejan de mostrar las fotos de Cristal.
UPDATE "SiteSettings" SET "secondaryColor" = 'oliva',
  "contactPhotoUrl" = '/images/contact-photo.webp',
  "brandsBannerUrl" = '/images/brands-banner.png'
WHERE "creatorId" IN (SELECT "id" FROM "Creator" WHERE "slug" = 'cristal');
