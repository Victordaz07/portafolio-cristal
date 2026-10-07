
-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "autoPublish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "publishAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishResults" JSONB;

