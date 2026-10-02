-- AlterTable
ALTER TABLE "ContentCard" ADD COLUMN     "postedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FollowerSnapshot" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowerSnapshot_platform_date_key" ON "FollowerSnapshot"("platform", "date");
