-- AlterTable
ALTER TABLE "BioLink" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "linksHeroEyebrow" TEXT,
ADD COLUMN     "linksHeroEyebrowEn" TEXT,
ADD COLUMN     "linksHeroImage" TEXT,
ADD COLUMN     "linksHeroShow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linksHeroTitle" TEXT,
ADD COLUMN     "linksHeroTitleEn" TEXT,
ADD COLUMN     "linksHeroUrl" TEXT,
ADD COLUMN     "linksShowCopy" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linksShowSocials" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "BioLinkGroup" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'custom',
    "title" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BioLinkGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BioLinkGroup_creatorId_idx" ON "BioLinkGroup"("creatorId");

-- AddForeignKey
ALTER TABLE "BioLink" ADD CONSTRAINT "BioLink_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BioLinkGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BioLinkGroup" ADD CONSTRAINT "BioLinkGroup_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Datos: cada sección de texto de los enlaces existentes pasa a ser un grupo (en el orden de su primer enlace).
INSERT INTO "BioLinkGroup" ("id", "creatorId", "kind", "title", "titleEn", "order")
SELECT 'grp_' || md5(l."creatorId" || '|' || l."section"), l."creatorId", 'custom',
       CASE WHEN l."section" = '' THEN 'Mis enlaces' ELSE l."section" END,
       MAX(l."sectionEn"), MIN(l."order")
FROM "BioLink" l
GROUP BY l."creatorId", l."section";

UPDATE "BioLink" SET "groupId" = 'grp_' || md5("creatorId" || '|' || "section");

-- Bloques automáticos para cada cuenta, al final, apagados si así estaban.
INSERT INTO "BioLinkGroup" ("id", "creatorId", "kind", "title", "hidden", "order")
SELECT 'grp_bk_' || s."creatorId", s."creatorId", 'brandkit', '', NOT s."linksShowBrandKit", 1000 FROM "SiteSettings" s;
INSERT INTO "BioLinkGroup" ("id", "creatorId", "kind", "title", "hidden", "order")
SELECT 'grp_rc_' || s."creatorId", s."creatorId", 'recent', '', NOT s."linksShowRecent", 1001 FROM "SiteSettings" s;
