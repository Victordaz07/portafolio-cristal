-- CreateTable
CREATE TABLE "BioLink" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "pill" TEXT,
    "wide" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BioLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BioLink_creatorId_idx" ON "BioLink"("creatorId");

-- AddForeignKey
ALTER TABLE "BioLink" ADD CONSTRAINT "BioLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

