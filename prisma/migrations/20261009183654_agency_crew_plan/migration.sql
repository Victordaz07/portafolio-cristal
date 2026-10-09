-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "accessCodeHash" TEXT,
ADD COLUMN     "accessCodeUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "agencyId" TEXT,
ADD COLUMN     "agencyRole" TEXT;

-- AlterTable
ALTER TABLE "Brand" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "agencyId" TEXT;

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "customDomainVerifiedAt" TIMESTAMP(3),
    "maxCreators" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'active',
    "comp" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "paidUntil" TIMESTAMP(3),
    "billingReminder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyPublicSettings" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "contactEmail" TEXT,
    "contactWhatsapp" TEXT,
    "services" JSONB NOT NULL DEFAULT '[]',
    "showcaseCreatorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPublicSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyPayment" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'crew',
    "months" INTEGER NOT NULL DEFAULT 1,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'reported',
    "periodEnd" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyAction" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "creatorId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_customDomain_key" ON "Agency"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPublicSettings_agencyId_key" ON "AgencyPublicSettings"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyPayment_agencyId_createdAt_idx" ON "AgencyPayment"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "AgencyPayment_status_idx" ON "AgencyPayment"("status");

-- CreateIndex
CREATE INDEX "AgencyAction_agencyId_createdAt_idx" ON "AgencyAction"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminUser_agencyId_idx" ON "AdminUser"("agencyId");

-- CreateIndex
CREATE INDEX "Creator_agencyId_idx" ON "Creator"("agencyId");

-- AddForeignKey
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyPublicSettings" ADD CONSTRAINT "AgencyPublicSettings_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyPayment" ADD CONSTRAINT "AgencyPayment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyAction" ADD CONSTRAINT "AgencyAction_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
