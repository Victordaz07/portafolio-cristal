-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "background" TEXT NOT NULL DEFAULT 'textura',
ADD COLUMN     "corners" TEXT NOT NULL DEFAULT 'suave',
ADD COLUMN     "customAccent" TEXT,
ADD COLUMN     "fontPair" TEXT NOT NULL DEFAULT 'editorial',
ADD COLUMN     "heroLayout" TEXT NOT NULL DEFAULT 'split',
ADD COLUMN     "sectionLayout" JSONB,
ADD COLUMN     "themeStyle" TEXT NOT NULL DEFAULT 'editorial';

