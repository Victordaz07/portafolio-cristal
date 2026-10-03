-- AlterTable
ALTER TABLE "BioLink" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "badgeEn" TEXT,
ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kicker" TEXT,
ADD COLUMN     "kickerEn" TEXT,
ADD COLUMN     "section" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sectionEn" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "linksPattern" TEXT NOT NULL DEFAULT 'blobs',
ADD COLUMN     "linksShowBrandKit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linksShowRecent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linksTagline" TEXT,
ADD COLUMN     "linksTaglineEn" TEXT;

