-- CreateTable
CREATE TABLE "CampaignReport" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "brandId" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "title" TEXT NOT NULL,
    "intro" TEXT,
    "data" JSONB NOT NULL,
    "hidden" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignReport_publicToken_key" ON "CampaignReport"("publicToken");

-- CreateIndex
CREATE INDEX "CampaignReport_creatorId_idx" ON "CampaignReport"("creatorId");

-- CreateIndex
CREATE INDEX "CampaignReport_brandId_idx" ON "CampaignReport"("brandId");

-- AddForeignKey
ALTER TABLE "CampaignReport" ADD CONSTRAINT "CampaignReport_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignReport" ADD CONSTRAINT "CampaignReport_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

