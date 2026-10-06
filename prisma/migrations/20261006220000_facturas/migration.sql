-- CreateTable
CREATE TABLE "BillingProfile" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "legalName" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "payTo" TEXT NOT NULL DEFAULT '',
    "termsDays" INTEGER NOT NULL DEFAULT 15,
    "depositPercent" INTEGER NOT NULL DEFAULT 50,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'FC',
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "defaultNotes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "brandId" TEXT,
    "number" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'full',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "payTo" TEXT NOT NULL,
    "billTo" JSONB NOT NULL,
    "issuer" JSONB NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "claimedPaidAt" TIMESTAMP(3),
    "lastReminderAt" TIMESTAMP(3),
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "overdueNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingProfile_creatorId_key" ON "BillingProfile"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_publicToken_key" ON "Invoice"("publicToken");

-- CreateIndex
CREATE INDEX "Invoice_creatorId_idx" ON "Invoice"("creatorId");

-- CreateIndex
CREATE INDEX "Invoice_brandId_idx" ON "Invoice"("brandId");

-- CreateIndex
CREATE INDEX "Invoice_status_dueAt_idx" ON "Invoice"("status", "dueAt");

-- AddForeignKey
ALTER TABLE "BillingProfile" ADD CONSTRAINT "BillingProfile_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

