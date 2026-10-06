-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "exclusivityCategory" TEXT,
ADD COLUMN     "exclusivityDays" INTEGER,
ADD COLUMN     "usageReminderAt" TIMESTAMP(3),
ADD COLUMN     "usageRightsDays" INTEGER,
ADD COLUMN     "usageRightsStart" TIMESTAMP(3),
ADD COLUMN     "whitelisting" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "network" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'todo',
    "proofUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "remindedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deliverable_creatorId_idx" ON "Deliverable"("creatorId");

-- CreateIndex
CREATE INDEX "Deliverable_brandId_idx" ON "Deliverable"("brandId");

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

