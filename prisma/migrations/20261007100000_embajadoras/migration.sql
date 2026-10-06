-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "ambassador" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ambassadorBadge" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ambassadorSince" TIMESTAMP(3),
ADD COLUMN     "ambassadorSource" TEXT,
ADD COLUMN     "referralCode" TEXT;

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'signed_up',
    "paidAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "rewardMonths" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_referralCode_key" ON "Creator"("referralCode");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

