-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "fontPairing" TEXT NOT NULL DEFAULT 'editorial',
ADD COLUMN     "backgroundStyle" TEXT NOT NULL DEFAULT 'clasico';
