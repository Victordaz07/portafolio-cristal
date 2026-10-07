
-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "imageUrl" TEXT,
    "buyUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_creatorId_idx" ON "Product"("creatorId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

