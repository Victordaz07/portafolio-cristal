-- AlterTable

-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "shareInsights" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareInsightsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NicheInsight" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "creators" INTEGER NOT NULL,
    "posts" INTEGER NOT NULL,
    "stats" JSONB NOT NULL,
    "playbook" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NicheInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NicheInsight_niche_key" ON "NicheInsight"("niche");

