-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "brandId" TEXT,
    "publicToken" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "title" TEXT NOT NULL,
    "terms" JSONB NOT NULL,
    "parties" JSONB NOT NULL,
    "bodyText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedName" TEXT,
    "acceptedEmail" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedIp" TEXT,
    "acceptedUserAgent" TEXT,
    "bodyHash" TEXT,
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_publicToken_key" ON "Contract"("publicToken");

-- CreateIndex
CREATE INDEX "Contract_creatorId_idx" ON "Contract"("creatorId");

-- CreateIndex
CREATE INDEX "Contract_brandId_idx" ON "Contract"("brandId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

