-- Foliocrew multiusuario: cada fila pasa a tener dueña (creatorId).
-- Los datos que ya existen son de Cristal, la creadora #1.

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customDomain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creator_slug_key" ON "Creator"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_customDomain_key" ON "Creator"("customDomain");

-- Cristal, creadora #1 (el nombre sale de su portada si existe)
INSERT INTO "Creator" ("id", "slug", "name", "updatedAt")
SELECT 'creator_cristal', 'cristal', COALESCE((SELECT "name" FROM "Hero" LIMIT 1), 'Cristal'), CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX "FollowerSnapshot_platform_date_key";

-- DropIndex
DROP INDEX "SocialAccount_platform_key";

-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'owner';

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "BrandEvent" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "ContentCard" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "FaqItem" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "FollowerSnapshot" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Hero" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "LogEntry" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Stat" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "creatorId" TEXT;

-- Asignar los datos existentes a Cristal y volver la columna obligatoria
UPDATE "ActionItem" SET "creatorId" = 'creator_cristal';
ALTER TABLE "ActionItem" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "ActionItem" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "AdminUser" SET "creatorId" = 'creator_cristal';
ALTER TABLE "AdminUser" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "AdminUser" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Brand" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Brand" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Brand" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "BrandEvent" SET "creatorId" = 'creator_cristal';
ALTER TABLE "BrandEvent" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "BrandEvent" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "ContactMessage" SET "creatorId" = 'creator_cristal';
ALTER TABLE "ContactMessage" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "ContactMessage" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "ContentCard" SET "creatorId" = 'creator_cristal';
ALTER TABLE "ContentCard" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "ContentCard" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "FaqItem" SET "creatorId" = 'creator_cristal';
ALTER TABLE "FaqItem" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "FaqItem" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "FollowerSnapshot" SET "creatorId" = 'creator_cristal';
ALTER TABLE "FollowerSnapshot" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "FollowerSnapshot" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Goal" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Goal" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Goal" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Hero" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Hero" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Hero" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "LogEntry" SET "creatorId" = 'creator_cristal';
ALTER TABLE "LogEntry" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "LogEntry" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Package" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Package" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Package" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Review" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Review" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "ScheduledPost" SET "creatorId" = 'creator_cristal';
ALTER TABLE "ScheduledPost" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "ScheduledPost" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Service" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Service" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "SiteSettings" SET "creatorId" = 'creator_cristal';
ALTER TABLE "SiteSettings" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "SiteSettings" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "SocialAccount" SET "creatorId" = 'creator_cristal';
ALTER TABLE "SocialAccount" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "SocialAccount" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Stat" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Stat" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Stat" ALTER COLUMN "creatorId" SET DEFAULT '';
UPDATE "Testimonial" SET "creatorId" = 'creator_cristal';
ALTER TABLE "Testimonial" ALTER COLUMN "creatorId" SET NOT NULL;
ALTER TABLE "Testimonial" ALTER COLUMN "creatorId" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "ActionItem_creatorId_idx" ON "ActionItem"("creatorId");

-- CreateIndex
CREATE INDEX "AdminUser_creatorId_idx" ON "AdminUser"("creatorId");

-- CreateIndex
CREATE INDEX "Brand_creatorId_idx" ON "Brand"("creatorId");

-- CreateIndex
CREATE INDEX "BrandEvent_creatorId_idx" ON "BrandEvent"("creatorId");

-- CreateIndex
CREATE INDEX "ContactMessage_creatorId_idx" ON "ContactMessage"("creatorId");

-- CreateIndex
CREATE INDEX "ContentCard_creatorId_idx" ON "ContentCard"("creatorId");

-- CreateIndex
CREATE INDEX "FaqItem_creatorId_idx" ON "FaqItem"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowerSnapshot_creatorId_platform_date_key" ON "FollowerSnapshot"("creatorId", "platform", "date");

-- CreateIndex
CREATE INDEX "Goal_creatorId_idx" ON "Goal"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_creatorId_key" ON "Hero"("creatorId");

-- CreateIndex
CREATE INDEX "LogEntry_creatorId_idx" ON "LogEntry"("creatorId");

-- CreateIndex
CREATE INDEX "Package_creatorId_idx" ON "Package"("creatorId");

-- CreateIndex
CREATE INDEX "Review_creatorId_idx" ON "Review"("creatorId");

-- CreateIndex
CREATE INDEX "ScheduledPost_creatorId_idx" ON "ScheduledPost"("creatorId");

-- CreateIndex
CREATE INDEX "Service_creatorId_idx" ON "Service"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_creatorId_key" ON "SiteSettings"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_creatorId_platform_key" ON "SocialAccount"("creatorId", "platform");

-- CreateIndex
CREATE INDEX "Stat_creatorId_idx" ON "Stat"("creatorId");

-- CreateIndex
CREATE INDEX "Testimonial_creatorId_idx" ON "Testimonial"("creatorId");

-- AddForeignKey
ALTER TABLE "Hero" ADD CONSTRAINT "Hero_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCard" ADD CONSTRAINT "ContentCard_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandEvent" ADD CONSTRAINT "BrandEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqItem" ADD CONSTRAINT "FaqItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowerSnapshot" ADD CONSTRAINT "FollowerSnapshot_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

