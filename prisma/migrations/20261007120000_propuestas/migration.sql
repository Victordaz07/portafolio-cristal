-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "pitchFollowUps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pitchOffer" TEXT,
ADD COLUMN     "pitchRepliedAt" TIMESTAMP(3),
ADD COLUMN     "pitchSentAt" TIMESTAMP(3);

