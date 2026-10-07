-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "priceFrom" INTEGER,
ADD COLUMN     "requestable" BOOLEAN NOT NULL DEFAULT false;

