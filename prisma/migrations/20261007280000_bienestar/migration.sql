
-- CreateTable
CREATE TABLE "ContentBankItem" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "contentType" TEXT NOT NULL DEFAULT 'reel',
    "networks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestPeriod" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "moved" JSONB NOT NULL,
    "brands" JSONB NOT NULL,
    "undoneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellbeingSettings" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "loadLimit" INTEGER NOT NULL DEFAULT 6,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellbeingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentBankItem_creatorId_idx" ON "ContentBankItem"("creatorId");

-- CreateIndex
CREATE INDEX "RestPeriod_creatorId_startDate_idx" ON "RestPeriod"("creatorId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "WellbeingSettings_creatorId_key" ON "WellbeingSettings"("creatorId");

-- AddForeignKey
ALTER TABLE "ContentBankItem" ADD CONSTRAINT "ContentBankItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestPeriod" ADD CONSTRAINT "RestPeriod_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingSettings" ADD CONSTRAINT "WellbeingSettings_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

