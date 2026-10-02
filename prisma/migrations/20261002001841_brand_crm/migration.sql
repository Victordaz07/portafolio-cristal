-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "dealStatus" TEXT,
ADD COLUMN     "dealValue" INTEGER,
ADD COLUMN     "lastContactAt" TIMESTAMP(3),
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDue" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "packageDetail" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "BrandEvent" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandEvent_brandId_date_idx" ON "BrandEvent"("brandId", "date");

-- AddForeignKey
ALTER TABLE "BrandEvent" ADD CONSTRAINT "BrandEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
