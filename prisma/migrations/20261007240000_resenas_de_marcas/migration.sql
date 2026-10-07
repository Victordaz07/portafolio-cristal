
-- CreateTable
CREATE TABLE "BrandReview" (
    "id" TEXT NOT NULL,
    "brandKey" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "payment" TEXT NOT NULL,
    "payDays" INTEGER,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "commentStatus" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandReviewReply" (
    "id" TEXT NOT NULL,
    "brandKey" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandReviewReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandReview_brandKey_idx" ON "BrandReview"("brandKey");

-- CreateIndex
CREATE INDEX "BrandReview_commentStatus_idx" ON "BrandReview"("commentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BrandReview_brandKey_reviewerId_key" ON "BrandReview"("brandKey", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandReviewReply_brandKey_key" ON "BrandReviewReply"("brandKey");

-- AddForeignKey
ALTER TABLE "BrandReview" ADD CONSTRAINT "BrandReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

