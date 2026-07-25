-- AlterTable
ALTER TABLE "Hero"
  ADD COLUMN "badgeLabel" TEXT NOT NULL DEFAULT 'UGC Creator / Brand Reviews',
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "headlineSuffix" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Stat"
  ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'star';
