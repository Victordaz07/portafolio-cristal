-- AlterTable
ALTER TABLE "ContentCard" ADD COLUMN     "comments" INTEGER,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likes" INTEGER,
ADD COLUMN     "metricsSyncedAt" TIMESTAMP(3),
ADD COLUMN     "saves" INTEGER,
ADD COLUMN     "shares" INTEGER,
ADD COLUMN     "showMetrics" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "topComment" TEXT,
ADD COLUMN     "topCommentAuthor" TEXT,
ADD COLUMN     "topCommentEn" TEXT,
ADD COLUMN     "views" INTEGER;
