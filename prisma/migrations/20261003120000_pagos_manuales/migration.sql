-- AlterTable

-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "billingReminder" TEXT,
ADD COLUMN     "comp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidUntil" TIMESTAMP(3),
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'pro',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "plan" TEXT NOT NULL,
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

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_creatorId_createdAt_idx" ON "Payment"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Las cuentas que ya existen son las fundadoras: quedan de cortesía (no pagan ni vencen).
UPDATE "Creator" SET "comp" = true;
